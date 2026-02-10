"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MemeGrid } from "@/components/meme/meme-grid";
import { MemeSkeletonGrid } from "@/components/meme/meme-skeleton";
import { FeedControls } from "./feed-controls";
import type { FeedMeme, FeedResponse } from "@/lib/validations/feed";

const DEFAULT_SORT = "hot";
const DEFAULT_PERIOD = "7d";
const PAGE_SIZE = 20;

interface FeedProps {
  /** Filter memes by community name */
  community?: string;
}

export function Feed({ community }: FeedProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") || DEFAULT_SORT;
  const period = searchParams.get("period") || DEFAULT_PERIOD;

  const [memes, setMemes] = useState<FeedMeme[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef(false);

  const fetchFeed = useCallback(
    async (nextCursor?: string) => {
      const isInitial = !nextCursor;

      // Abort any in-flight request (prevents stale responses overwriting state)
      if (isInitial && abortRef.current) {
        abortRef.current.abort();
      }

      // Synchronous guard against IntersectionObserver double-fire
      if (!isInitial && fetchingRef.current) return;

      const controller = new AbortController();
      abortRef.current = controller;
      fetchingRef.current = true;

      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          sort,
          limit: String(PAGE_SIZE),
        });
        if (sort === "top") params.set("period", period);
        if (nextCursor) params.set("cursor", nextCursor);
        if (community) params.set("community", community);

        const res = await fetch(`/api/memes?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load memes");

        const data: FeedResponse = await res.json();

        setMemes((prev) => (isInitial ? data.memes : [...prev, ...data.memes]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setError("");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Something went wrong loading the feed.");
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, period, community]
  );

  // Reset and fetch on sort/period change
  useEffect(() => {
    setMemes([]);
    setCursor(null);
    setHasMore(true);
    fetchFeed();
    return () => abortRef.current?.abort();
  }, [fetchFeed]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !fetchingRef.current && !loading && cursor) {
          fetchFeed(cursor);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor, fetchFeed]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    // Remove period param when not sorting by top
    if (key === "sort" && value !== "top") params.delete("period");
    router.push(`?${params}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <FeedControls
        sort={sort}
        period={period}
        onSortChange={(s) => updateParams("sort", s)}
        onPeriodChange={(p) => updateParams("period", p)}
      />

      {/* Initial loading */}
      {loading && <MemeSkeletonGrid />}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-center">
          <p className="font-mono text-sm text-error">&gt; ERROR: {error}</p>
          <button
            onClick={() => fetchFeed()}
            className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Memes */}
      {!loading && !error && memes.length > 0 && (
        <>
          <MemeGrid memes={memes} />

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-mint border-t-transparent" />
            </div>
          )}

          {/* End of feed */}
          {!hasMore && (
            <p className="py-6 text-center font-mono text-xs text-zinc-600">
              &gt; END OF FEED — you&apos;ve seen them all
            </p>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !error && memes.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface/50 px-6 py-16 text-center">
          <pre className="font-mono text-2xl text-zinc-700 select-none">
            ¯\_(ツ)_/¯
          </pre>
          <p className="font-mono text-sm text-zinc-500">
            No memes yet — be the first to generate one!
          </p>
          <a
            href="/create"
            className="rounded-lg bg-mint px-6 py-2.5 font-mono text-sm font-semibold text-black transition-all hover:bg-mint-dim hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          >
            + Create Meme
          </a>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
