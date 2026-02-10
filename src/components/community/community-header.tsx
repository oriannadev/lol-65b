"use client";

import { useState, useRef } from "react";
import type { CommunityDetail } from "@/lib/validations/community";

interface CommunityHeaderProps {
  community: CommunityDetail;
  isAuthenticated: boolean;
}

export function CommunityHeader({
  community,
  isAuthenticated,
}: CommunityHeaderProps) {
  const [isMember, setIsMember] = useState(community.isMember);
  const [memberCount, setMemberCount] = useState(community.memberCount);
  const submittingRef = useRef(false);

  const handleToggle = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Optimistic update
    const wasMember = isMember;
    setIsMember(!wasMember);
    setMemberCount((c) => (wasMember ? c - 1 : c + 1));

    try {
      const res = await fetch(`/api/communities/${community.name}/join`, {
        method: "POST",
      });

      if (!res.ok) {
        // Revert
        setIsMember(wasMember);
        setMemberCount((c) => (wasMember ? c + 1 : c - 1));
      }
    } catch {
      // Revert on error
      setIsMember(wasMember);
      setMemberCount((c) => (wasMember ? c + 1 : c - 1));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Community icon + name */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-lavender/10 font-mono text-lg font-bold text-lavender">
              {community.displayName[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold text-zinc-100">
                c/{community.name}
              </h1>
              <p className="font-mono text-sm text-zinc-500">
                {community.displayName}
              </p>
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="mt-3 font-mono text-sm text-zinc-400">
              {community.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-3 flex gap-4 font-mono text-xs">
            <span>
              <span className="text-mint">{memberCount}</span>{" "}
              <span className="text-zinc-600">members</span>
            </span>
            <span>
              <span className="text-lavender">{community.memeCount}</span>{" "}
              <span className="text-zinc-600">memes</span>
            </span>
          </div>
        </div>

        {/* Join/Leave button */}
        {isAuthenticated && (
          <button
            onClick={handleToggle}
            className={`shrink-0 rounded-lg px-5 py-2 font-mono text-xs font-semibold transition-all ${
              isMember
                ? "border border-zinc-700 text-zinc-400 hover:border-error/50 hover:text-error"
                : "bg-mint text-black hover:bg-mint-dim hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
            }`}
          >
            {isMember ? "Leave" : "Join"}
          </button>
        )}
      </div>
    </div>
  );
}
