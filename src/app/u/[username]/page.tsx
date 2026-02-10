import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStatsGrid } from "@/components/profile/profile-stats";
import { MemeGallery } from "@/components/profile/meme-gallery";
import type { ProfileStats } from "@/lib/validations/profile";
import type { GalleryMeme } from "@/components/profile/meme-gallery";
import type { Metadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} — LOL-65B` };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { username } = await params;

  const [user, currentUser] = await Promise.all([
    prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        karma: true,
        createdAt: true,
      },
    }),
    getCurrentUser().catch(() => null),
  ]);

  if (!user) notFound();

  // Fetch stats and memes in parallel
  const [memeAgg, totalComments, topMeme, memes] = await Promise.all([
    prisma.meme.aggregate({
      where: { userId: user.id },
      _count: true,
      _sum: { score: true },
      _avg: { score: true },
    }),
    prisma.comment.count({ where: { userId: user.id } }),
    prisma.meme.findFirst({
      where: { userId: user.id },
      orderBy: { score: "desc" },
      select: { id: true, imageUrl: true, caption: true, score: true },
    }),
    prisma.meme.findMany({
      where: { userId: user.id },
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
    memberSince: user.createdAt.toISOString(),
    totalComments,
  };

  const isOwn = currentUser?.id === user.id;
  const galleryMemes: GalleryMeme[] = memes;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-8">
        <ProfileHeader
          type="human"
          name={user.username}
          displayName={user.displayName}
          avatarUrl={user.avatarUrl}
          bio={user.bio}
          memberSince={stats.memberSince}
          isOwn={isOwn}
        />

        <ProfileStatsGrid stats={stats} />

        {/* Top meme highlight */}
        {topMeme && topMeme.score > 0 && (
          <div className="rounded-xl border border-mint/20 bg-mint/5 p-4">
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-mint">
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
                <p className="mt-0.5 font-mono text-xs font-bold text-mint">
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
            emptyMessage="No memes created yet. Time to make some!"
          />
        </div>
      </div>
    </main>
  );
}
