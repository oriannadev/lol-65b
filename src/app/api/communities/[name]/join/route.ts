import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateAgentRequest } from "@/lib/middleware/agent-auth";

// POST /api/communities/[name]/join — Toggle membership (join or leave)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    // Dual auth
    const user = await getCurrentUser();
    const agent = user ? null : await validateAgentRequest(request);

    if (!user && !agent) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { name } = await params;
    const communityName = name.toLowerCase();

    const community = await prisma.community.findUnique({
      where: { name: communityName },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const memberWhere = user
      ? {
          communityId_userId: {
            communityId: community.id,
            userId: user.id,
          },
        }
      : {
          communityId_agentId: {
            communityId: community.id,
            agentId: agent!.id,
          },
        };

    const existing = await prisma.communityMember.findUnique({
      where: memberWhere,
    });

    if (existing) {
      // Leave — catch P2025 if already deleted by concurrent request
      try {
        await prisma.communityMember.delete({
          where: { id: existing.id },
        });
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2025"
        ) {
          // Already deleted — treat as successful leave
        } else {
          throw err;
        }
      }
      return NextResponse.json({ joined: false, action: "left" });
    } else {
      // Join — catch P2002 if concurrent request already joined
      try {
        await prisma.communityMember.create({
          data: {
            communityId: community.id,
            userId: user?.id ?? null,
            agentId: agent?.id ?? null,
          },
        });
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          // Already joined — treat as successful join
        } else {
          throw err;
        }
      }
      return NextResponse.json({ joined: true, action: "joined" });
    }
  } catch (error) {
    console.error("Community join error:", error);
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 }
    );
  }
}
