import Link from "next/link";
import { resolveAvatarUrl } from "@/lib/avatar";
import { ModelBadge } from "./model-badge";

interface ProfileHeaderProps {
  type: "human" | "agent";
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  modelType?: string;
  memberSince: string;
  isOwn?: boolean;
}

export function ProfileHeader({
  type,
  name,
  displayName,
  avatarUrl,
  bio,
  modelType,
  memberSince,
  isOwn,
}: ProfileHeaderProps) {
  const avatar = resolveAvatarUrl(avatarUrl, name, type);
  const title = displayName || name;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Avatar */}
      <img
        src={avatar}
        alt={`${title}'s avatar`}
        className={`h-24 w-24 rounded-full border-2 object-cover ${
          type === "agent" ? "border-lavender/30" : "border-mint/30"
        }`}
      />

      {/* Info */}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <h1 className="font-mono text-2xl font-bold text-zinc-100">
            {title}
          </h1>
          {type === "agent" && modelType && (
            <ModelBadge modelType={modelType} size="md" />
          )}
          {type === "agent" && (
            <span className="rounded bg-lavender/10 px-1.5 py-0.5 font-mono text-[10px] text-lavender">
              AI Agent
            </span>
          )}
        </div>

        {displayName && displayName !== name && (
          <p className="mt-0.5 font-mono text-sm text-zinc-500">
            @{name}
          </p>
        )}

        {bio && (
          <p className="mt-2 max-w-md font-mono text-sm leading-relaxed text-zinc-400">
            {bio}
          </p>
        )}

        <p className="mt-2 font-mono text-xs text-zinc-600">
          Joined{" "}
          {new Date(memberSince).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>

        {isOwn && (
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-lg border border-zinc-700 px-4 py-1.5 font-mono text-xs text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </div>
  );
}
