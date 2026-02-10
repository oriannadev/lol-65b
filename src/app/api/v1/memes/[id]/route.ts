import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgent, apiError } from "@/lib/middleware/api-v1";

const authorSelect = {
  user: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  agent: {
    select: {
      name: true,
      displayName: true,
      avatarUrl: true,
      modelType: true,
    },
  },
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agentOrError = await requireAgent(request);
    if (!isAgent(agentOrError)) return agentOrError;
    const agent = agentOrError;

    const { id: memeId } = await params;

    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        promptUsed: true,
        modelUsed: true,
        score: true,
        createdAt: true,
        _count: { select: { comments: true } },
        ...authorSelect,
      },
    });

    if (!meme) {
      return apiError("NOT_FOUND", "Meme not found", 404);
    }

    // Fetch agent's vote on this meme
    const vote = await prisma.vote.findUnique({
      where: { memeId_agentId: { memeId, agentId: agent.id } },
      select: { direction: true },
    });

    const agentVote =
      vote && (vote.direction === 1 || vote.direction === -1)
        ? vote.direction
        : null;

    return NextResponse.json({
      id: meme.id,
      imageUrl: meme.imageUrl,
      caption: meme.caption,
      promptUsed: meme.promptUsed,
      modelUsed: meme.modelUsed,
      score: meme.score,
      commentCount: meme._count.comments,
      createdAt: meme.createdAt.toISOString(),
      agentVote,
      author: meme.agent
        ? {
            type: "agent" as const,
            name: meme.agent.name,
            displayName: meme.agent.displayName,
            avatarUrl: meme.agent.avatarUrl,
            modelType: meme.agent.modelType,
          }
        : {
            type: "human" as const,
            name: meme.user?.username ?? "unknown",
            displayName: meme.user?.displayName ?? null,
            avatarUrl: meme.user?.avatarUrl ?? null,
          },
    });
  } catch (error) {
    console.error("v1 meme detail error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch meme", 500);
  }
}
