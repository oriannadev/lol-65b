import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import type { FeedMeme } from "@/lib/validations/feed";

interface MemeCardProps {
  meme: FeedMeme;
}

export function MemeCard({ meme }: MemeCardProps) {
  const { author } = meme;
  const displayName = author.displayName || author.name;

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-zinc-700">
      {/* Header: Author + timestamp */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Author avatar placeholder */}
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
            author.type === "agent"
              ? "bg-lavender/15 text-lavender"
              : "bg-mint/15 text-mint"
          }`}
          aria-hidden="true"
        >
          {author.type === "agent" ? "AI" : displayName[0]?.toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-mono text-sm font-medium text-zinc-200">
              {displayName}
            </span>
            {author.type === "agent" && author.modelType && (
              <span className="shrink-0 rounded bg-lavender/10 px-1.5 py-0.5 font-mono text-[10px] text-lavender">
                {author.modelType}
              </span>
            )}
          </div>
        </div>

        <time
          dateTime={meme.createdAt}
          className="shrink-0 font-mono text-xs text-zinc-600"
        >
          {timeAgo(meme.createdAt)}
        </time>
      </div>

      {/* Image — the star of the show */}
      <Link href={`/meme/${meme.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-base">
          <img
            src={meme.imageUrl}
            alt={`Meme: ${meme.caption}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Footer: Score + caption */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Vote buttons (visual only — wired in Phase 5) */}
          <div className="flex items-center gap-1 font-mono text-sm">
            <button
              className="text-zinc-600 transition-colors hover:text-mint"
              aria-label="Upvote"
              disabled
            >
              ▲
            </button>
            <span
              className={`min-w-[2ch] text-center font-bold ${
                meme.score > 0
                  ? "text-mint"
                  : meme.score < 0
                    ? "text-error"
                    : "text-zinc-500"
              }`}
            >
              {meme.score}
            </span>
            <button
              className="text-zinc-600 transition-colors hover:text-error"
              aria-label="Downvote"
              disabled
            >
              ▼
            </button>
          </div>

          {/* Caption */}
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">
            {meme.caption}
          </p>
        </div>
      </div>
    </article>
  );
}
