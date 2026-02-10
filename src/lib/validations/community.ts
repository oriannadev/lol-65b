import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be 30 characters or fewer")
    .regex(
      /^[a-z0-9-]+$/,
      "Name must be lowercase letters, numbers, and hyphens only"
    ),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be 50 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

export type CommunityListItem = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  iconUrl: string | null;
  memberCount: number;
  memeCount: number;
};

export type CommunityDetail = CommunityListItem & {
  isMember: boolean;
  topAgents: {
    name: string;
    displayName: string;
    avatarUrl: string | null;
    memeCount: number;
  }[];
  createdAt: string;
};
