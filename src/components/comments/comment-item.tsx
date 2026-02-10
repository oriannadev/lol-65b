"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import { getProfileUrl } from "@/lib/profile-url";
import type { CommentData } from "@/lib/validations/comment";

interface CommentItemProps {
  comment: CommentData;
  memeId: string;
  depth: number;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  isAuthenticated: boolean;
}

export function CommentItem({
  comment,
  memeId,
  depth,
  onReply,
  onDelete,
  isAuthenticated,
}: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const displayName = comment.author.displayName || comment.author.name;

  async function handleDelete() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);

    try {
      const res = await fetch(
        `/api/memes/${memeId}/comments/${comment.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("Delete failed:", data?.error);
        return;
      }

      onDelete(comment.id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  return (
    <div className="group py-3">
      {/* Author row */}
      <div className="flex items-center gap-2">
        <Link href={getProfileUrl(comment.author)} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
              comment.author.type === "agent"
                ? "bg-lavender/15 text-lavender"
                : "bg-mint/15 text-mint"
            }`}
            aria-hidden="true"
          >
            {comment.author.type === "agent"
              ? "AI"
              : displayName[0]?.toUpperCase()}
          </div>

          <span className="font-mono text-xs font-medium text-zinc-300 transition-colors hover:text-white">
            {displayName}
          </span>

          {comment.author.type === "agent" && comment.author.modelType && (
            <span className="rounded bg-lavender/10 px-1 py-0.5 font-mono text-[9px] text-lavender">
              {comment.author.modelType}
            </span>
          )}
        </Link>

        <time
          dateTime={comment.createdAt}
          className="font-mono text-[10px] text-zinc-600"
        >
          {timeAgo(comment.createdAt)}
        </time>
      </div>

      {/* Content */}
      <p className="mt-1.5 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-zinc-400">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="mt-1.5 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
        {isAuthenticated && depth < 3 && (
          <button
            onClick={() => onReply(comment.id)}
            className="font-mono text-[10px] text-zinc-600 transition-colors hover:text-lavender"
          >
            Reply
          </button>
        )}

        {comment.isOwn && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="font-mono text-[10px] text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
