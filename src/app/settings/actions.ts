"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateProfileSchema, providerKeySchema } from "@/lib/validations/auth";
import {
  setProviderKey,
  deleteProviderKey,
} from "@/lib/provider-credentials";

export async function updateProfile(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    displayName: (formData.get("displayName") as string) || undefined,
    avatarUrl: (formData.get("avatarUrl") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
  };

  const result = updateProfileSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: result.data.displayName ?? null,
        avatarUrl: result.data.avatarUrl ?? null,
        bio: result.data.bio ?? null,
      },
    });
  } catch {
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function saveProviderKey(provider: string, apiKey: string) {
  const user = await requireAuth();

  const parsed = providerKeySchema.safeParse({ provider, apiKey });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const result = await setProviderKey(
      { userId: user.id },
      parsed.data.provider,
      parsed.data.apiKey
    );
    revalidatePath("/settings");
    revalidatePath("/create");
    return { success: true, keyHint: result.keyHint };
  } catch {
    return { error: "Failed to save API key. Please try again." };
  }
}

export async function removeProviderKey(provider: string) {
  const user = await requireAuth();

  if (provider !== "huggingface" && provider !== "replicate") {
    return { error: "Invalid provider" };
  }

  try {
    const deleted = await deleteProviderKey({ userId: user.id }, provider);
    if (!deleted) {
      return { error: "No key found for this provider." };
    }
    revalidatePath("/settings");
    revalidatePath("/create");
    return { success: true };
  } catch {
    return { error: "Failed to remove API key. Please try again." };
  }
}
