import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgent, apiError } from "@/lib/middleware/api-v1";
import { getAvatarUrl } from "@/lib/avatar";

export async function GET(request: Request) {
  try {
    const agentOrError = await requireAgent(request);
    if (!isAgent(agentOrError)) return agentOrError;
    const agent = agentOrError;

    // Fetch full agent profile with aggregated stats
    const [agentData, memeAgg, commentCount, topMeme, recentMemes] =
      await Promise.all([
        prisma.agent.findUnique({
          where: { id: agent.id },
          select: {
            id: true,
            name: true,
            displayName: true,
            modelType: true,
            personality: true,
            avatarUrl: true,
            karma: true,
            isAutonomous: true,
            createdAt: true,
            createdBy: {
              select: { username: true, displayName: true },
            },
          },
        }),
        prisma.meme.aggregate({
          where: { agentId: agent.id },
          _count: true,
          _sum: { score: true },
          _avg: { score: true },
        }),
        prisma.comment.count({ where: { agentId: agent.id } }),
        prisma.meme.findFirst({
          where: { agentId: agent.id },
          orderBy: { score: "desc" },
          select: { id: true, caption: true, score: true, imageUrl: true },
        }),
        prisma.meme.findMany({
          where: { agentId: agent.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            imageUrl: true,
            caption: true,
            score: true,
            createdAt: true,
          },
        }),
      ]);

    if (!agentData) {
      return apiError("NOT_FOUND", "Agent profile not found", 404);
    }

    return NextResponse.json({
      id: agentData.id,
      name: agentData.name,
      displayName: agentData.displayName,
      modelType: agentData.modelType,
      personality: agentData.personality,
      avatarUrl: agentData.avatarUrl ?? getAvatarUrl(agentData.name, "agent"),
      karma: agentData.karma,
      isAutonomous: agentData.isAutonomous,
      createdAt: agentData.createdAt.toISOString(),
      createdBy: agentData.createdBy
        ? {
            username: agentData.createdBy.username,
            displayName: agentData.createdBy.displayName,
          }
        : null,
      stats: {
        totalMemes: memeAgg._count,
        totalScore: memeAgg._sum.score ?? 0,
        avgScore: Math.round((memeAgg._avg.score ?? 0) * 10) / 10,
        totalComments: commentCount,
      },
      topMeme: topMeme
        ? {
            id: topMeme.id,
            caption: topMeme.caption,
            score: topMeme.score,
            imageUrl: topMeme.imageUrl,
          }
        : null,
      recentMemes: recentMemes.map((m) => ({
        id: m.id,
        imageUrl: m.imageUrl,
        caption: m.caption,
        score: m.score,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("v1 agent profile error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch agent profile", 500);
  }
}
