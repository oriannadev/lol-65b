import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const CURRENT_KEY_VERSION = 1;

/**
 * Get the encryption key for a specific version.
 * Supports key rotation: ENCRYPTION_KEY (v1), ENCRYPTION_KEY_V2, etc.
 */
function getEncryptionKey(version: number = CURRENT_KEY_VERSION): Buffer {
  const envVar =
    version === 1 ? "ENCRYPTION_KEY" : `ENCRYPTION_KEY_V${version}`;
  const key = process.env[envVar];
  if (!key) {
    throw new Error(
      `Missing encryption key: ${envVar}. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `${envVar} must be exactly 32 bytes (64 hex characters)`
    );
  }
  return buf;
}

export interface EncryptedData {
  encryptedKey: string; // base64
  iv: string; // base64
  authTag: string; // base64
  keyVersion: number;
}

/**
 * Encrypt an API key using AES-256-GCM with AAD binding.
 * AAD prevents ciphertext swapping between providers/owners.
 */
export function encryptApiKey(plaintext: string, aad: string): EncryptedData {
  const key = getEncryptionKey(CURRENT_KEY_VERSION);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: CURRENT_KEY_VERSION,
  };
}

/**
 * Decrypt an API key. Supports multiple key versions for rotation.
 */
export function decryptApiKey(data: EncryptedData, aad: string): string {
  const key = getEncryptionKey(data.keyVersion);
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, "base64")
  );
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(data.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.encryptedKey, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Get a safe hint for display: "...xK4f" (last 4 chars).
 */
export function getKeyHint(plainKey: string): string {
  if (plainKey.length < 4) return "...****";
  return `...${plainKey.slice(-4)}`;
}

/**
 * Build AAD string for a provider credential.
 * Binds ciphertext to a specific provider + owner type + owner ID,
 * preventing swapping attacks across providers and owner namespaces.
 */
export function buildAAD(
  provider: string,
  ownerId: string,
  ownerType: "user" | "agent" = "user"
): string {
  return `${provider}:${ownerType}:${ownerId}`;
}
