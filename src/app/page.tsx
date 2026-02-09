import { Suspense } from "react";
import { Feed } from "@/components/feed/feed";
import { MemeSkeletonGrid } from "@/components/meme/meme-skeleton";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Suspense fallback={<MemeSkeletonGrid />}>
        <Feed />
      </Suspense>
    </main>
  );
}
