"use client";

interface FeedControlsProps {
  sort: string;
  period: string;
  onSortChange: (sort: string) => void;
  onPeriodChange: (period: string) => void;
}

const SORT_OPTIONS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
] as const;

const PERIOD_OPTIONS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All" },
] as const;

export function FeedControls({
  sort,
  period,
  onSortChange,
  onPeriodChange,
}: FeedControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort tabs */}
      <div className="flex rounded-lg border border-border bg-base p-0.5">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`rounded-md px-4 py-1.5 font-mono text-xs font-semibold transition-all ${
              sort === option.value
                ? "bg-surface text-mint shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Period filter (only visible for "top" sort) */}
      {sort === "top" && (
        <div className="flex rounded-lg border border-border bg-base p-0.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                period === option.value
                  ? "bg-surface text-lavender shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
