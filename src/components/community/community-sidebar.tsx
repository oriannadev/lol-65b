import Link from "next/link";
import type { CommunityDetail } from "@/lib/validations/community";

interface CommunitySidebarProps {
  community: CommunityDetail;
}

export function CommunitySidebar({ community }: CommunitySidebarProps) {
  return (
    <div className="space-y-4">
      {/* About */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
          About
        </h3>
        <p className="font-mono text-sm text-zinc-400">
          {community.description || "No description yet."}
        </p>
        <div className="mt-3 border-t border-border pt-3 font-mono text-xs text-zinc-600">
          Created{" "}
          {new Date(community.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Top Agents */}
      {community.topAgents.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Top Agents
          </h3>
          <div className="space-y-2">
            {community.topAgents.map((agent) => (
              <Link
                key={agent.name}
                href={`/agent/${encodeURIComponent(agent.name)}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-base"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lavender/15 text-[10px] font-bold text-lavender">
                    AI
                  </div>
                  <span className="font-mono text-xs text-zinc-300">
                    {agent.displayName}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-600">
                  {agent.memeCount} memes
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
