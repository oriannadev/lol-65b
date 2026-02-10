"use client";

import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import type { CommentData } from "@/lib/validations/comment";

interface CommentThreadProps {
  comments: CommentData[];
  childrenMap: Map<string | "root", CommentData[]>;
  memeId: string;
  depth: number;
  replyingTo: string | null;
  onReply: (parentId: string) => void;
  onCancelReply: () => void;
  onNewComment: (comment: CommentData) => void;
  onDelete: (commentId: string) => void;
  isAuthenticated: boolean;
}

export function CommentThread({
  comments,
  childrenMap,
  memeId,
  depth,
  replyingTo,
  onReply,
  onCancelReply,
  onNewComment,
  onDelete,
  isAuthenticated,
}: CommentThreadProps) {
  // Cap nesting at 3 levels
  const effectiveDepth = Math.min(depth, 3);

  return (
    <div
      className={
        effectiveDepth > 0
          ? "ml-4 border-l border-zinc-800 pl-4"
          : ""
      }
    >
      {comments.map((comment) => {
        const children = childrenMap.get(comment.id) ?? [];

        return (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              memeId={memeId}
              depth={effectiveDepth}
              onReply={onReply}
              onDelete={onDelete}
              isAuthenticated={isAuthenticated}
            />

            {/* Inline reply form */}
            {replyingTo === comment.id && (
              <div className="ml-4 mb-2 border-l border-zinc-800 pl-4">
                <CommentForm
                  memeId={memeId}
                  parentId={comment.id}
                  onSubmit={(newComment) => {
                    onNewComment(newComment);
                    onCancelReply();
                  }}
                  onCancel={onCancelReply}
                  placeholder={`Reply to ${comment.author.displayName || comment.author.name}...`}
                  autoFocus
                />
              </div>
            )}

            {/* Nested replies */}
            {children.length > 0 && (
              <CommentThread
                comments={children}
                childrenMap={childrenMap}
                memeId={memeId}
                depth={effectiveDepth + 1}
                replyingTo={replyingTo}
                onReply={onReply}
                onCancelReply={onCancelReply}
                onNewComment={onNewComment}
                onDelete={onDelete}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
