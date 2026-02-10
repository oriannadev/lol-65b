import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

/**
 * /me redirects to the current user's profile page.
 * Used by the navbar so we don't need the username in the client.
 */
export default async function MePage() {
  const user = await requireAuth();
  redirect(`/u/${user.username}`);
}
