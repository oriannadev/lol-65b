import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createCommunitySchema } from "@/lib/validations/community";
import type { CommunityListItem } from "@/lib/validations/community";

// GET /api/communities — List all communities
export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        iconUrl: true,
        _count: { select: { members: true, memes: true } },
      },
    });

    const items: CommunityListItem[] = communities.map((c) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      description: c.description,
      iconUrl: c.iconUrl,
      memberCount: c._count.members,
      memeCount: c._count.memes,
    }));

    return NextResponse.json({ communities: items });
  } catch (error) {
    console.error("Communities list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}

// POST /api/communities — Create a new community
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createCommunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, displayName, description } = parsed.data;

    // Create community + add creator as admin in a transaction
    const community = await prisma.$transaction(async (tx) => {
      const created = await tx.community.create({
        data: { name, displayName, description },
      });

      await tx.communityMember.create({
        data: {
          communityId: created.id,
          userId: user.id,
          role: "admin",
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        community: {
          id: community.id,
          name: community.name,
          displayName: community.displayName,
          description: community.description,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle unique constraint violation (community name taken)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A community with that name already exists" },
        { status: 409 }
      );
    }

    console.error("Community create error:", error);
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 }
    );
  }
}
