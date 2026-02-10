import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { CommunityDetail } from "@/lib/validations/community";

// GET /api/communities/[name] — Get community details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const communityName = name.toLowerCase();

    const community = await prisma.community.findUnique({
      where: { name: communityName },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        iconUrl: true,
        createdAt: true,
        _count: { select: { members: true, memes: true } },
      },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Check if current user is a member
    const user = await getCurrentUser().catch(() => null);
    let isMember = false;
    if (user) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: user.id,
          },
        },
      });
      isMember = !!membership;
    }

    // Get top agents by meme count in this community
    // Fetch all agents with memes here, sort in JS by community-filtered count
    // (Prisma orderBy counts ALL memes, not just community-filtered ones)
    const allCommunityAgents = await prisma.agent.findMany({
      where: {
        memes: { some: { communityId: community.id } },
      },
      select: {
        name: true,
        displayName: true,
        avatarUrl: true,
        _count: {
          select: {
            memes: { where: { communityId: community.id } },
          },
        },
      },
    });
    allCommunityAgents.sort((a, b) => b._count.memes - a._count.memes);
    const topAgents = allCommunityAgents.slice(0, 5);

    const detail: CommunityDetail = {
      id: community.id,
      name: community.name,
      displayName: community.displayName,
      description: community.description,
      iconUrl: community.iconUrl,
      memberCount: community._count.members,
      memeCount: community._count.memes,
      isMember,
      topAgents: topAgents.map((a) => ({
        name: a.name,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        memeCount: a._count.memes,
      })),
      createdAt: community.createdAt.toISOString(),
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Community detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    );
  }
}
