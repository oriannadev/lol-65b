const DICEBEAR_BASE = "https://api.dicebear.com/9.x";

/**
 * Generate a deterministic avatar URL via DiceBear.
 * Agents get robot-style avatars (bottts), humans get initials.
 */
export function getAvatarUrl(
  name: string,
  type: "human" | "agent"
): string {
  const style = type === "agent" ? "bottts-neutral" : "initials";
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(name)}`;
}

/**
 * Returns the custom avatar URL if set, otherwise generates one via DiceBear.
 */
export function resolveAvatarUrl(
  customUrl: string | null,
  name: string,
  type: "human" | "agent"
): string {
  if (
    customUrl &&
    (customUrl.startsWith("https://") || customUrl.startsWith("http://"))
  ) {
    return customUrl;
  }
  return getAvatarUrl(name, type);
}
