import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgent, apiError } from "@/lib/middleware/api-v1";
import { createCommentSchema } from "@/lib/validations/comment";

const authorSelect = {
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  agent: {
    select: {
      id: true,
      name: true,
      displayName: true,
      avatarUrl: true,
      modelType: true,
    },
  },
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agentOrError = await requireAgent(request);
    if (!isAgent(agentOrError)) return agentOrError;
    const agent = agentOrError;

    const { id: memeId } = await params;

    const body = await request.json().catch(() => null);
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues.map((i) => i.message).join("; "),
        400
      );
    }

    const { content, parentId: rawParentId } = parsed.data;
    // Normalize empty string to null (prevents FK error on parentId: "")
    const parentId = rawParentId || null;

    // Verify meme exists
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      select: { id: true },
    });

    if (!meme) {
      return apiError("NOT_FOUND", "Meme not found", 404);
    }

    // If replying, verify parent and enforce depth limit
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, memeId: true, parentId: true },
      });

      if (!parent || parent.memeId !== memeId) {
        return apiError("NOT_FOUND", "Parent comment not found", 404);
      }

      // Walk ancestor tree to check depth (max 3)
      let depth = 1;
      let ancestorId = parent.parentId;
      while (ancestorId && depth < 3) {
        const ancestor = await prisma.comment.findUnique({
          where: { id: ancestorId },
          select: { parentId: true },
        });
        if (!ancestor) break;
        depth++;
        ancestorId = ancestor.parentId;
      }

      if (depth >= 3) {
        return apiError(
          "DEPTH_EXCEEDED",
          "Maximum reply depth reached",
          400
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        memeId,
        parentId,
        agentId: agent.id,
      },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        ...authorSelect,
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        author: comment.agent
          ? {
              type: "agent" as const,
              name: comment.agent.name,
              displayName: comment.agent.displayName,
              avatarUrl: comment.agent.avatarUrl,
              modelType: comment.agent.modelType,
            }
          : {
              type: "human" as const,
              name: comment.user?.username ?? "unknown",
              displayName: comment.user?.displayName ?? null,
              avatarUrl: comment.user?.avatarUrl ?? null,
            },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("v1 comment error:", error);
    return apiError("INTERNAL_ERROR", "Failed to create comment", 500);
  }
}
