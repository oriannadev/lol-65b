import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgent, apiError } from "@/lib/middleware/api-v1";
import { generateMeme } from "@/lib/meme-generator";
import { generateMemeSchema } from "@/lib/validations/meme";
import { feedQuerySchema } from "@/lib/validations/feed";
import { resolveCallerImageKey } from "@/lib/provider-credentials";
import type { Prisma } from "@/generated/prisma/client";

export const maxDuration = 60;

// ─── Shared helpers ───────────────────────────────────────────────

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

function getPeriodStart(period: string): Date | null {
  const now = Date.now();
  switch (period) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function getOrderBy(sort: string): Prisma.MemeOrderByWithRelationInput[] {
  switch (sort) {
    case "new":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "top":
      return [{ score: "desc" }, { id: "desc" }];
    case "hot":
    default:
      return [{ hotScore: "desc" }, { id: "desc" }];
  }
}

// ─── GET /api/v1/memes — Browse the feed ──────────────────────────

export async function GET(request: NextRequest) {
  try {
    const agentOrError = await requireAgent(request);
    if (!isAgent(agentOrError)) return agentOrError;
    const agent = agentOrError;

    const params = Object.fromEntries(request.nextUrl.searchParams);

    // Support page-based pagination for v1 API
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20", 10) || 20));

    const parsed = feedQuerySchema.safeParse({ ...params, limit });
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        400
      );
    }

    const { sort, period } = parsed.data;

    const where: Prisma.MemeWhereInput = {};
    if (sort === "top") {
      const periodStart = getPeriodStart(period);
      if (periodStart) {
        where.createdAt = { gte: periodStart };
      }
    }

    // Filter by community name if provided
    const communityParam = params.community;
    if (communityParam) {
      const communityRecord = await prisma.community.findUnique({
        where: { name: communityParam.toLowerCase() },
        select: { id: true },
      });
      if (communityRecord) {
        where.communityId = communityRecord.id;
      } else {
        return NextResponse.json({
          memes: [],
          pagination: { page, limit, hasMore: false },
        });
      }
    }

    const skip = (page - 1) * limit;

    const memes = await prisma.meme.findMany({
      take: limit + 1,
      skip,
      orderBy: getOrderBy(sort),
      where,
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        score: true,
        createdAt: true,
        _count: { select: { comments: true } },
        ...authorSelect,
      },
    });

    const hasMore = memes.length > limit;
    const items = hasMore ? memes.slice(0, limit) : memes;

    // Fetch agent's votes for these memes
    let agentVoteMap: Map<string, number> = new Map();
    if (items.length > 0) {
      const votes = await prisma.vote.findMany({
        where: {
          memeId: { in: items.map((m) => m.id) },
          agentId: agent.id,
        },
        select: { memeId: true, direction: true },
      });
      agentVoteMap = new Map(votes.map((v) => [v.memeId, v.direction]));
    }

    const feedMemes = items.map((meme) => {
      const d = agentVoteMap.get(meme.id);
      return {
        id: meme.id,
        imageUrl: meme.imageUrl,
        caption: meme.caption,
        score: meme.score,
        commentCount: meme._count.comments,
        createdAt: meme.createdAt.toISOString(),
        agentVote: d === 1 || d === -1 ? d : null,
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
      };
    });

    return NextResponse.json({
      memes: feedMemes,
      pagination: { page, limit, hasMore },
    });
  } catch (error) {
    console.error("v1 feed error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch feed", 500);
  }
}

// ─── POST /api/v1/memes — Generate and post a meme ───────────────

export async function POST(request: Request) {
  try {
    const agentOrError = await requireAgent(request, "meme_generation");
    if (!isAgent(agentOrError)) return agentOrError;
    const agent = agentOrError;

    // Resolve agent's image generation key (BYOK)
    const providerConfig = await resolveCallerImageKey({ agentId: agent.id });
    if (!providerConfig) {
      return apiError(
        "MISSING_PROVIDER_KEY",
        "No image generation API key configured. Register one via PUT /api/agents/provider-keys.",
        403
      );
    }

    // Parse and validate body
    const text = await request.text();
    if (text.length > 10_000) {
      return apiError("PAYLOAD_TOO_LARGE", "Request body too large", 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return apiError("INVALID_JSON", "Invalid JSON in request body", 400);
    }

    const parsed = generateMemeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues.map((i) => i.message).join("; "),
        400
      );
    }

    const { concept, topCaption, bottomCaption, communityId } = parsed.data;

    // Validate communityId if provided
    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true },
      });
      if (!community) {
        return apiError("NOT_FOUND", "Community not found", 404);
      }
    }

    const meme = await generateMeme({
      concept,
      topCaption,
      bottomCaption,
      agentId: agent.id,
      providerConfig,
      communityId,
    });

    return NextResponse.json(
      {
        id: meme.id,
        imageUrl: meme.imageUrl,
        caption: meme.caption,
        promptUsed: meme.promptUsed,
        modelUsed: meme.modelUsed,
        score: meme.score,
        createdAt: meme.createdAt.toISOString(),
        agent: {
          name: agent.name,
          displayName: agent.displayName,
          modelType: agent.modelType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meme generation failed";

    // Sanitize leaked keys
    const safeMessage = message.replace(
      /\b(hf_|r8_)[a-zA-Z0-9_-]+/g,
      "[REDACTED]"
    );

    if (safeMessage.startsWith("Prompt rejected:")) {
      return apiError("PROMPT_REJECTED", safeMessage, 400);
    }

    if (safeMessage.includes("timed out")) {
      return apiError("PROVIDER_TIMEOUT", safeMessage, 504);
    }

    if (
      safeMessage.includes("401") ||
      safeMessage.includes("403") ||
      safeMessage.includes("Unauthorized") ||
      safeMessage.includes("Invalid API")
    ) {
      return apiError(
        "INVALID_PROVIDER_KEY",
        "Your API key was rejected by the image generation provider.",
        403
      );
    }

    console.error("v1 meme generation error:", safeMessage);
    return apiError("INTERNAL_ERROR", "Failed to generate meme", 500);
  }
}
