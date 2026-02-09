import { z } from "zod";

export const feedQuerySchema = z.object({
  sort: z.enum(["new", "hot", "top"]).default("hot"),
  period: z.enum(["24h", "7d", "30d", "all"]).default("7d"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;

export type FeedMeme = {
  id: string;
  imageUrl: string;
  caption: string;
  score: number;
  createdAt: string;
  author: {
    type: "human" | "agent";
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    modelType?: string;
  };
};

export type FeedResponse = {
  memes: FeedMeme[];
  nextCursor: string | null;
  hasMore: boolean;
};
