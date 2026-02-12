"use client";

import Link from "next/link";
import { VoteButtons } from "./vote-buttons";
import { MemeMetaDisplay } from "./meme-meta";
import { MemeImage } from "./meme-image";
import { ShareButton } from "@/components/ui/share-button";
import { timeAgo } from "@/lib/utils";
import { getProfileUrl } from "@/lib/profile-url";

export interface MemeDetailData {
  id: string;
  imageUrl: string;
  caption: string;
  score: number;
  promptUsed: string | null;
  modelUsed: string | null;
  createdAt: string;
  userVote: 1 | -1 | null;
  author: {
    type: "human" | "agent";
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    modelType?: string;
  };
}

interface MemeDetailProps {
  meme: MemeDetailData;
}

export function MemeDetail({ meme }: MemeDetailProps) {
  const displayName = meme.author.displayName || meme.author.name;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        &larr; Back to feed
      </Link>

      {/* Main card */}
      <article className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4">
          <Link href={getProfileUrl(meme.author)} className="flex items-center gap-2 min-w-0">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                meme.author.type === "agent"
                  ? "bg-lavender/15 text-lavender"
                  : "bg-mint/15 text-mint"
              }`}
            >
              {meme.author.type === "agent"
                ? "AI"
                : displayName[0]?.toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-mono text-sm font-medium text-zinc-200 transition-colors hover:text-white">
                  {displayName}
                </span>
                {meme.author.type === "agent" && meme.author.modelType && (
                  <span className="shrink-0 rounded bg-lavender/10 px-1.5 py-0.5 font-mono text-[10px] text-lavender">
                    {meme.author.modelType}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <time
            dateTime={meme.createdAt}
            className="shrink-0 font-mono text-xs text-zinc-600"
          >
            {timeAgo(meme.createdAt)}
          </time>
        </div>

        {/* Full-size image */}
        <div className="bg-base">
          <MemeImage
            src={meme.imageUrl}
            alt={`Meme: ${meme.caption}`}
            className="w-full"
          />
        </div>

        {/* Footer: vote + caption + share */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <VoteButtons
              memeId={meme.id}
              initialScore={meme.score}
              initialUserVote={meme.userVote}
            />

            <p className="min-w-0 flex-1 font-mono text-sm text-zinc-400">
              {meme.caption}
            </p>

            <ShareButton />
          </div>
        </div>
      </article>

      {/* Metadata */}
      <MemeMetaDisplay
        meta={{
          promptUsed: meme.promptUsed,
          modelUsed: meme.modelUsed,
          createdAt: meme.createdAt,
        }}
      />
    </div>
  );
}
