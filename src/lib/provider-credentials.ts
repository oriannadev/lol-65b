import "server-only";
import { prisma } from "@/lib/prisma";
import {
  encryptApiKey,
  decryptApiKey,
  getKeyHint,
  buildAAD,
} from "@/lib/encryption";
import type { ImageProviderConfig } from "@/lib/providers/image-gen";

type Provider = "huggingface" | "replicate";

interface CredentialOwner {
  userId?: string;
  agentId?: string;
}

/** Validate that exactly one owner field is set. */
function validateOwner(owner: CredentialOwner): string {
  const hasUser = !!owner.userId;
  const hasAgent = !!owner.agentId;
  if (hasUser && hasAgent) throw new Error("Owner must have userId OR agentId, not both");
  if (!hasUser && !hasAgent) throw new Error("Owner must have userId or agentId");
  return owner.userId ?? owner.agentId!;
}

/** Get owner type for AAD binding. */
function ownerType(owner: CredentialOwner): "user" | "agent" {
  return owner.userId ? "user" : "agent";
}

interface ProviderKeyHint {
  provider: Provider;
  keyHint: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Store (or update) an encrypted provider API key for a user or agent.
 */
export async function setProviderKey(
  owner: CredentialOwner,
  provider: Provider,
  plainKey: string
): Promise<ProviderKeyHint> {
  const ownerId = validateOwner(owner);
  const aad = buildAAD(provider, ownerId, ownerType(owner));
  const encrypted = encryptApiKey(plainKey, aad);
  const keyHint = getKeyHint(plainKey);

  const data = {
    provider,
    encryptedKey: encrypted.encryptedKey,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    keyHint,
    keyVersion: encrypted.keyVersion,
    userId: owner.userId ?? null,
    agentId: owner.agentId ?? null,
  };

  // Upsert: update if exists for this provider+owner, create otherwise
  const where = owner.userId
    ? { provider_userId: { provider, userId: owner.userId } }
    : { provider_agentId: { provider, agentId: owner.agentId! } };

  const credential = await prisma.providerCredential.upsert({
    where,
    update: {
      encryptedKey: data.encryptedKey,
      iv: data.iv,
      authTag: data.authTag,
      keyHint: data.keyHint,
      keyVersion: data.keyVersion,
    },
    create: data,
  });

  return {
    provider: credential.provider as Provider,
    keyHint: credential.keyHint,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

/**
 * Decrypt and return a provider API key for a user or agent.
 */
export async function getProviderKey(
  owner: CredentialOwner,
  provider: Provider
): Promise<string | null> {
  const ownerId = owner.userId ?? owner.agentId;
  if (!ownerId) return null; // Graceful null for resolve flows

  const where = owner.userId
    ? { provider_userId: { provider, userId: owner.userId } }
    : { provider_agentId: { provider, agentId: owner.agentId! } };

  const credential = await prisma.providerCredential.findUnique({ where });
  if (!credential) return null;

  const aad = buildAAD(provider, ownerId, ownerType(owner));
  return decryptApiKey(
    {
      encryptedKey: credential.encryptedKey,
      iv: credential.iv,
      authTag: credential.authTag,
      keyVersion: credential.keyVersion,
    },
    aad
  );
}

/**
 * List provider key hints for a user or agent (never exposes raw keys).
 */
export async function listProviderKeys(
  owner: CredentialOwner
): Promise<ProviderKeyHint[]> {
  if (!owner.userId && !owner.agentId) return [];

  const credentials = await prisma.providerCredential.findMany({
    where: {
      userId: owner.userId ?? undefined,
      agentId: owner.agentId ?? undefined,
    },
    select: {
      provider: true,
      keyHint: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { provider: "asc" },
  });

  return credentials.map((c) => ({
    provider: c.provider as Provider,
    keyHint: c.keyHint,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

/**
 * Delete a provider credential for a user or agent.
 */
export async function deleteProviderKey(
  owner: CredentialOwner,
  provider: Provider
): Promise<boolean> {
  const where = owner.userId
    ? { provider_userId: { provider, userId: owner.userId } }
    : { provider_agentId: { provider, agentId: owner.agentId! } };

  try {
    await prisma.providerCredential.delete({ where });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the image generation key for a caller.
 * Tries HuggingFace first, then Replicate.
 * Returns null if no key is configured — caller must handle 403.
 */
export async function resolveCallerImageKey(
  owner: CredentialOwner
): Promise<ImageProviderConfig | null> {
  // Try HuggingFace first (free tier, preferred)
  const hfKey = await getProviderKey(owner, "huggingface");
  if (hfKey) {
    return { provider: "huggingface", apiKey: hfKey };
  }

  // Fall back to Replicate
  const repKey = await getProviderKey(owner, "replicate");
  if (repKey) {
    return { provider: "replicate", apiKey: repKey };
  }

  return null;
}
