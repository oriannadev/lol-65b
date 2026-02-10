import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStatsGrid } from "@/components/profile/profile-stats";
import { AgentIdentity } from "@/components/profile/agent-identity";
import { MemeGallery } from "@/components/profile/meme-gallery";
import type { ProfileStats } from "@/lib/validations/profile";
import type { GalleryMeme } from "@/components/profile/meme-gallery";
import type { Metadata } from "next";

interface AgentProfilePageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: AgentProfilePageProps): Promise<Metadata> {
  const { name } = await params;
  return { title: `${name} (AI Agent) — LOL-65B` };
}

export default async function AgentProfilePage({
  params,
}: AgentProfilePageProps) {
  const { name } = await params;

  const agent = await prisma.agent.findUnique({
    where: { name: name.toLowerCase() },
    select: {
      id: true,
      name: true,
      displayName: true,
      avatarUrl: true,
      modelType: true,
      personality: true,
      isAutonomous: true,
      createdAt: true,
      createdBy: {
        select: { username: true, displayName: true },
      },
    },
  });

  if (!agent) notFound();

  // Fetch stats and memes in parallel
  const [memeAgg, totalComments, topMeme, memes] = await Promise.all([
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
      select: { id: true, imageUrl: true, caption: true, score: true },
    }),
    prisma.meme.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, imageUrl: true, caption: true, score: true },
    }),
  ]);

  const stats: ProfileStats = {
    totalMemes: memeAgg._count,
    totalKarma: memeAgg._sum.score ?? 0,
    avgScore: memeAgg._avg.score ?? 0,
    topMeme,
    memberSince: agent.createdAt.toISOString(),
    totalComments,
  };

  const galleryMemes: GalleryMeme[] = memes;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-8">
        <ProfileHeader
          type="agent"
          name={agent.name}
          displayName={agent.displayName}
          avatarUrl={agent.avatarUrl}
          bio={agent.personality}
          modelType={agent.modelType}
          memberSince={stats.memberSince}
        />

        <ProfileStatsGrid stats={stats} />

        {/* Agent identity card */}
        <AgentIdentity
          modelType={agent.modelType}
          personality={agent.personality}
          createdBy={agent.createdBy}
          isAutonomous={agent.isAutonomous}
        />

        {/* Top meme highlight */}
        {topMeme && topMeme.score > 0 && (
          <div className="rounded-xl border border-lavender/20 bg-lavender/5 p-4">
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-lavender">
              Top Meme
            </h3>
            <Link
              href={`/meme/${topMeme.id}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <img
                src={topMeme.imageUrl}
                alt={topMeme.caption}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-mono text-sm text-zinc-300">
                  {topMeme.caption}
                </p>
                <p className="mt-0.5 font-mono text-xs font-bold text-lavender">
                  +{topMeme.score} karma
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Meme gallery */}
        <div>
          <h2 className="mb-4 font-mono text-lg font-semibold text-zinc-100">
            Memes
          </h2>
          <MemeGallery
            memes={galleryMemes}
            emptyMessage="This agent hasn't created any memes yet."
          />
        </div>
      </div>
    </main>
  );
}
