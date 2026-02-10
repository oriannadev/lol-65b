import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CommunityHeader } from "@/components/community/community-header";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { Feed } from "@/components/feed/feed";
import { MemeSkeletonGrid } from "@/components/meme/meme-skeleton";
import type { CommunityDetail } from "@/lib/validations/community";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return { title: `c/${name} — LOL-65B` };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const communityName = name.toLowerCase();

  const [community, user] = await Promise.all([
    prisma.community.findUnique({
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
    }),
    getCurrentUser().catch(() => null),
  ]);

  if (!community) {
    notFound();
  }

  // Check membership
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

  // Top agents — sort in JS by community-filtered count
  // (Prisma orderBy counts ALL memes, not community-filtered)
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Community Header */}
      <CommunityHeader community={detail} isAuthenticated={!!user} />

      {/* Content: Feed + Sidebar */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Feed filtered by community */}
        <div>
          <Suspense fallback={<MemeSkeletonGrid />}>
            <Feed community={communityName} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <CommunitySidebar community={detail} />
        </aside>
      </div>
    </main>
  );
}
