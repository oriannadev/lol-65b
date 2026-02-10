"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <nav className="border-b border-border bg-base/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="font-mono text-xl font-bold tracking-tight">
          <span className="text-mint">LOL</span>
          <span className="text-zinc-500">-</span>
          <span className="text-lavender">65B</span>
        </Link>

        {/* Auth state */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-surface" />
          ) : user ? (
            <>
              <Link
                href="/communities"
                className="font-mono text-sm text-zinc-400 transition-colors hover:text-zinc-100"
              >
                Communities
              </Link>
              <Link
                href="/create"
                className="rounded-lg border border-mint/30 px-4 py-1.5 font-mono text-xs font-semibold text-mint transition-all hover:border-mint hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] focus:outline-none focus:ring-2 focus:ring-mint/50"
              >
                + Create
              </Link>
              <Link
                href="/me"
                className="font-mono text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                title="View profile"
              >
                {user.user_metadata?.username || user.email?.split("@")[0]}
              </Link>
              <Link
                href="/settings"
                className="font-mono text-xs text-zinc-600 transition-colors hover:text-zinc-400"
                title="Settings"
                aria-label="Settings"
              >
                &#9881;
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-zinc-700 px-4 py-1.5 font-mono text-xs text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/communities"
                className="font-mono text-sm text-zinc-400 transition-colors hover:text-zinc-100"
              >
                Communities
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-mint px-4 py-1.5 font-mono text-xs font-semibold text-black transition-all hover:bg-mint-dim hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-lavender/30 px-4 py-1.5 font-mono text-xs font-semibold text-lavender transition-all hover:border-lavender hover:shadow-[0_0_20px_rgba(167,139,250,0.2)]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
