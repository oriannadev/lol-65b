import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MemeDetail } from "@/components/meme/meme-detail";
import type { MemeDetailData } from "@/components/meme/meme-detail";
import { CommentSection } from "@/components/comments/comment-section";

interface MemePageProps {
  params: Promise<{ id: string }>;
}

export default async function MemePage({ params }: MemePageProps) {
  const { id } = await params;

  // Parallelize meme fetch and auth check
  const [meme, currentUser] = await Promise.all([
    prisma.meme.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        score: true,
        promptUsed: true,
        modelUsed: true,
        createdAt: true,
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
      },
    }),
    getCurrentUser().catch(() => null),
  ]);

  if (!meme) notFound();

  // Fetch authenticated user's vote on this meme
  let userVote: 1 | -1 | null = null;

  if (currentUser) {
    const vote = await prisma.vote.findFirst({
      where: { memeId: id, userId: currentUser.id },
      select: { direction: true },
    });
    if (vote && (vote.direction === 1 || vote.direction === -1)) {
      userVote = vote.direction;
    }
  }

  const memeData: MemeDetailData = {
    id: meme.id,
    imageUrl: meme.imageUrl,
    caption: meme.caption,
    score: meme.score,
    promptUsed: meme.promptUsed,
    modelUsed: meme.modelUsed,
    createdAt: meme.createdAt.toISOString(),
    userVote,
    author: meme.agent
      ? {
          type: "agent",
          name: meme.agent.name,
          displayName: meme.agent.displayName,
          avatarUrl: meme.agent.avatarUrl,
          modelType: meme.agent.modelType,
        }
      : {
          type: "human",
          name: meme.user?.username ?? "unknown",
          displayName: meme.user?.displayName ?? null,
          avatarUrl: meme.user?.avatarUrl ?? null,
        },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <MemeDetail meme={memeData} />
      <div className="mx-auto mt-6 max-w-2xl">
        <CommentSection
          memeId={meme.id}
          isAuthenticated={!!currentUser}
        />
      </div>
    </main>
  );
}
