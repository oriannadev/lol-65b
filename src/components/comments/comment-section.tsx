"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CommentForm } from "./comment-form";
import { CommentThread } from "./comment-thread";
import type { CommentData } from "@/lib/validations/comment";

interface CommentSectionProps {
  memeId: string;
  isAuthenticated: boolean;
}

function buildChildrenMap(comments: CommentData[]) {
  const map = new Map<string | "root", CommentData[]>();
  map.set("root", []);

  for (const comment of comments) {
    const key = comment.parentId ?? "root";
    const existing = map.get(key);
    if (existing) {
      existing.push(comment);
    } else {
      map.set(key, [comment]);
    }
  }

  return map;
}

export function CommentSection({ memeId, isAuthenticated }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchComments = useCallback(async () => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch(`/api/memes/${memeId}/comments`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to load comments");

      const data = await res.json();
      if (!controller.signal.aborted) {
        setComments(data.comments);
        setError(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Failed to load comments");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [memeId]);

  useEffect(() => {
    fetchComments();
    return () => abortRef.current?.abort();
  }, [fetchComments]);

  const handleNewComment = useCallback((comment: CommentData) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  const handleDelete = useCallback((commentId: string) => {
    setComments((prev) => {
      // Remove the deleted comment, orphaned replies become root-level
      return prev.map((c) =>
        c.parentId === commentId ? { ...c, parentId: null } : c
      ).filter((c) => c.id !== commentId);
    });
  }, []);

  const childrenMap = buildChildrenMap(comments);
  const rootComments = childrenMap.get("root") ?? [];

  return (
    <section className="rounded-xl border border-border bg-surface px-5 py-4">
      <h2 className="mb-4 font-mono text-sm font-medium text-zinc-300">
        Comments{" "}
        <span className="text-zinc-600">({comments.length})</span>
      </h2>

      {/* New comment form */}
      {isAuthenticated ? (
        <div className="mb-4">
          <CommentForm
            memeId={memeId}
            onSubmit={handleNewComment}
          />
        </div>
      ) : (
        <p className="mb-4 rounded-lg border border-border bg-base px-3 py-2 font-mono text-xs text-zinc-600">
          Log in to join the conversation.
        </p>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-zinc-800" />
                <div className="h-3 w-20 rounded bg-zinc-800" />
              </div>
              <div className="h-4 w-3/4 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="font-mono text-xs text-red-400">{error}</p>
      ) : rootComments.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-zinc-600">
          No comments yet — start the conversation!
        </p>
      ) : (
        <CommentThread
          comments={rootComments}
          childrenMap={childrenMap}
          memeId={memeId}
          depth={0}
          replyingTo={replyingTo}
          onReply={setReplyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onNewComment={handleNewComment}
          onDelete={handleDelete}
          isAuthenticated={isAuthenticated}
        />
      )}
    </section>
  );
}
