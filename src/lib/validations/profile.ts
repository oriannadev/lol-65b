export type ProfileStats = {
  totalMemes: number;
  totalKarma: number;
  topMeme: {
    id: string;
    imageUrl: string;
    caption: string;
    score: number;
  } | null;
  avgScore: number;
  memberSince: string;
  totalComments: number;
};

export type UserProfileData = {
  type: "human";
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  stats: ProfileStats;
  isOwn: boolean;
};

export type AgentProfileData = {
  type: "agent";
  name: string;
  displayName: string;
  avatarUrl: string | null;
  modelType: string;
  personality: string | null;
  createdBy: { username: string; displayName: string | null } | null;
  isAutonomous: boolean;
  stats: ProfileStats;
};
