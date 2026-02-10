import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateAgentRequest } from "@/lib/middleware/agent-auth";
import { createCommentSchema } from "@/lib/validations/comment";
import type { CommentData, CommentsResponse } from "@/lib/validations/comment";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memeId } = await params;

    // Verify meme exists
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      select: { id: true },
    });

    if (!meme) {
      return NextResponse.json({ error: "Meme not found" }, { status: 404 });
    }

    // Get current caller for isOwn flag (human or agent)
    const currentUser = await getCurrentUser().catch(() => null);
    const currentAgent = currentUser ? null : await validateAgentRequest(request);

    // Fetch comments with a soft cap (500 — MVP scale)
    const comments = await prisma.comment.findMany({
      where: { memeId },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        userId: true,
        agentId: true,
        ...authorSelect,
      },
    });

    const commentData: CommentData[] = comments.map((c) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.agent
        ? {
            type: "agent" as const,
            name: c.agent.name,
            displayName: c.agent.displayName,
            avatarUrl: c.agent.avatarUrl,
            modelType: c.agent.modelType,
          }
        : {
            type: "human" as const,
            name: c.user?.username ?? "unknown",
            displayName: c.user?.displayName ?? null,
            avatarUrl: c.user?.avatarUrl ?? null,
          },
      isOwn: currentUser
        ? c.userId === currentUser.id
        : currentAgent
          ? c.agentId === currentAgent.id
          : false,
    }));

    const response: CommentsResponse = { comments: commentData };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Comments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memeId } = await params;

    // Dual auth: human user or agent API key
    const user = await getCurrentUser();
    const agent = user ? null : await validateAgentRequest(request);

    if (!user && !agent) {
      return NextResponse.json(
        { error: "Authentication required. Log in to comment." },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid comment", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, parentId } = parsed.data;

    // Verify meme exists
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      select: { id: true },
    });

    if (!meme) {
      return NextResponse.json({ error: "Meme not found" }, { status: 404 });
    }

    // If replying, verify parent comment exists, belongs to this meme, and depth < 3
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, memeId: true, parentId: true },
      });

      if (!parent || parent.memeId !== memeId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Compute depth by walking ancestors (max 3 hops)
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
        return NextResponse.json(
          { error: "Maximum reply depth reached" },
          { status: 400 }
        );
      }
    }

    // Build author identity (XOR: userId or agentId)
    const authorData = user
      ? { userId: user.id }
      : { agentId: agent!.id };

    const comment = await prisma.comment.create({
      data: {
        content,
        memeId,
        parentId: parentId ?? null,
        ...authorData,
      },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        ...authorSelect,
      },
    });

    const commentData: CommentData = {
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
      isOwn: true,
    };

    return NextResponse.json(commentData, { status: 201 });
  } catch (error) {
    console.error("Comment create error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
