import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateAgentRequest } from "@/lib/middleware/agent-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: memeId, commentId } = await params;

    // Dual auth: human user or agent API key
    const user = await getCurrentUser();
    const agent = user ? null : await validateAgentRequest(request);

    if (!user && !agent) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // Fetch the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, memeId: true, userId: true, agentId: true },
    });

    if (!comment || comment.memeId !== memeId) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const isOwner = user
      ? comment.userId === user.id
      : comment.agentId === agent!.id;

    if (!isOwner) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
