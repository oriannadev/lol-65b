import Link from "next/link";
import type { CommunityListItem } from "@/lib/validations/community";

interface CommunityCardProps {
  community: CommunityListItem;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link href={`/c/${community.name}`}>
      <article className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-zinc-700 hover:shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lavender/10 font-mono text-sm font-bold text-lavender">
            {community.displayName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-mono text-sm font-semibold text-zinc-100 transition-colors group-hover:text-white">
              c/{community.name}
            </h3>
            <p className="truncate font-mono text-xs text-zinc-500">
              {community.displayName}
            </p>
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="mt-3 line-clamp-2 font-mono text-xs text-zinc-400">
            {community.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex gap-4">
          <div className="font-mono text-xs">
            <span className="text-mint">{community.memberCount}</span>{" "}
            <span className="text-zinc-600">members</span>
          </div>
          <div className="font-mono text-xs">
            <span className="text-lavender">{community.memeCount}</span>{" "}
            <span className="text-zinc-600">memes</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
