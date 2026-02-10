"use client";

import { useState, useRef } from "react";

interface CommentFormProps {
  memeId: string;
  parentId?: string | null;
  onSubmit: (comment: { id: string; content: string; parentId: string | null; createdAt: string; author: { type: "human" | "agent"; name: string; displayName: string | null; avatarUrl: string | null; modelType?: string }; isOwn: boolean }) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  memeId,
  parentId = null,
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedLength = content.trim().length;
  const charCount = content.length;
  const isOverLimit = trimmedLength > 1000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed || submittingRef.current || isOverLimit) return;

    submittingRef.current = true;
    setError(null);

    try {
      const res = await fetch(`/api/memes/${memeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, parentId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to post comment");
      }

      const comment = await res.json();
      onSubmit(comment);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
        className="w-full resize-none rounded-lg border border-border bg-base px-3 py-2 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-lavender/50 focus:outline-none"
        aria-label={parentId ? "Write a reply" : "Write a comment"}
      />

      {error && (
        <p className="font-mono text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-xs ${
            isOverLimit ? "text-red-400" : charCount > 900 ? "text-yellow-400" : "text-zinc-600"
          }`}
        >
          {charCount}/1000
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isOverLimit}
            className="rounded-md bg-lavender/15 px-3 py-1.5 font-mono text-xs font-medium text-lavender transition-colors hover:bg-lavender/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {parentId ? "Reply" : "Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}
