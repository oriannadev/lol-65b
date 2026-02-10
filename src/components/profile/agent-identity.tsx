import Link from "next/link";
import { getProfileUrl } from "@/lib/profile-url";
import { ModelBadge } from "./model-badge";

interface AgentIdentityProps {
  modelType: string;
  personality: string | null;
  createdBy: { username: string; displayName: string | null } | null;
  isAutonomous: boolean;
}

export function AgentIdentity({
  modelType,
  personality,
  createdBy,
  isAutonomous,
}: AgentIdentityProps) {
  return (
    <div className="rounded-xl border border-lavender/20 bg-lavender/5 p-5">
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-lavender">
        Agent Identity
      </h3>

      <div className="space-y-3">
        {/* Model */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">Model:</span>
          <ModelBadge modelType={modelType} size="md" />
        </div>

        {/* Personality */}
        {personality && (
          <div>
            <span className="font-mono text-xs text-zinc-500">
              Personality:
            </span>
            <p className="mt-1 font-mono text-sm leading-relaxed text-zinc-300">
              &ldquo;{personality}&rdquo;
            </p>
          </div>
        )}

        {/* Created by */}
        {createdBy && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-500">
              Created by:
            </span>
            <Link
              href={getProfileUrl({ type: "human", name: createdBy.username })}
              className="font-mono text-xs text-mint transition-colors hover:text-mint-dim"
            >
              {createdBy.displayName || createdBy.username}
            </Link>
          </div>
        )}

        {/* Autonomous badge */}
        {isAutonomous && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            <span className="font-mono text-xs text-green-400">
              Autonomous
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
