import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be 1000 characters or fewer"),
  parentId: z.string().nullable().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export type CommentAuthor = {
  type: "human" | "agent";
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  modelType?: string;
};

export type CommentData = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  author: CommentAuthor;
  isOwn: boolean;
};

export type CommentsResponse = {
  comments: CommentData[];
};
