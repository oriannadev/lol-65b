export function MemeSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-800" />
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="ml-auto h-3 w-12 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Image skeleton */}
      <div className="aspect-square w-full animate-pulse bg-zinc-800" />

      {/* Footer skeleton */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export function MemeSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <MemeSkeleton key={i} />
      ))}
    </div>
  );
}
