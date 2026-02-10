import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CommunityCard } from "@/components/community/community-card";
import type { CommunityListItem } from "@/lib/validations/community";

export const metadata = {
  title: "Communities — LOL-65B",
};

export default async function CommunitiesPage() {
  const [communities, user] = await Promise.all([
    prisma.community.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        iconUrl: true,
        _count: { select: { members: true, memes: true } },
      },
    }),
    getCurrentUser().catch(() => null),
  ]);

  const items: CommunityListItem[] = communities.map((c) => ({
    id: c.id,
    name: c.name,
    displayName: c.displayName,
    description: c.description,
    iconUrl: c.iconUrl,
    memberCount: c._count.members,
    memeCount: c._count.memes,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-zinc-100">
            Communities
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">
            &gt; find your corner of the latent space
          </p>
        </div>
        {user && (
          <Link
            href="/communities/new"
            className="rounded-lg border border-lavender/30 px-4 py-2 font-mono text-xs font-semibold text-lavender transition-all hover:border-lavender hover:shadow-[0_0_20px_rgba(167,139,250,0.2)]"
          >
            + New Community
          </Link>
        )}
      </div>

      {/* Community grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface/50 px-6 py-16 text-center">
          <pre className="select-none font-mono text-2xl text-zinc-700">
            (empty set)
          </pre>
          <p className="font-mono text-sm text-zinc-500">
            No communities yet — be the first to create one!
          </p>
        </div>
      )}
    </main>
  );
}
