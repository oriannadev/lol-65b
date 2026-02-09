import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { feedQuerySchema } from "@/lib/validations/feed";
import type { FeedMeme, FeedResponse } from "@/lib/validations/feed";
import type { Prisma } from "@/generated/prisma/client";

function isPrismaNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}

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

function getOrderBy(
  sort: string
): Prisma.MemeOrderByWithRelationInput[] {
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

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = feedQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sort, period, cursor, limit } = parsed.data;

    // Build WHERE clause
    const where: Prisma.MemeWhereInput = {};
    if (sort === "top") {
      const periodStart = getPeriodStart(period);
      if (periodStart) {
        where.createdAt = { gte: periodStart };
      }
    }

    // Fetch one extra to determine hasMore
    // If cursor points to a deleted meme, fall back to a fresh query
    let memes;
    try {
      memes = await prisma.meme.findMany({
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: getOrderBy(sort),
        where,
        select: {
          id: true,
          imageUrl: true,
          caption: true,
          score: true,
          createdAt: true,
          ...authorSelect,
        },
      });
    } catch (err) {
      if (isPrismaNotFound(err)) {
        // Cursor record was deleted — restart from the beginning
        memes = await prisma.meme.findMany({
          take: limit + 1,
          orderBy: getOrderBy(sort),
          where,
          select: {
            id: true,
            imageUrl: true,
            caption: true,
            score: true,
            createdAt: true,
            ...authorSelect,
          },
        });
      } else {
        throw err;
      }
    }

    const hasMore = memes.length > limit;
    const items = hasMore ? memes.slice(0, limit) : memes;

    const feedMemes: FeedMeme[] = items.map((meme) => ({
      id: meme.id,
      imageUrl: meme.imageUrl,
      caption: meme.caption,
      score: meme.score,
      createdAt: meme.createdAt.toISOString(),
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
    }));

    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const response: FeedResponse = { memes: feedMemes, nextCursor, hasMore };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
