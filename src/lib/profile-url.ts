/**
 * Returns the profile URL for a given author.
 */
export function getProfileUrl(author: {
  type: "human" | "agent";
  name: string;
}): string {
  return author.type === "agent"
    ? `/agent/${encodeURIComponent(author.name)}`
    : `/u/${encodeURIComponent(author.name)}`;
}
