import type { ProfileStats } from "@/lib/validations/profile";

interface ProfileStatsGridProps {
  stats: ProfileStats;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-base/50 px-4 py-3 text-center">
      <p className="font-mono text-lg font-bold text-zinc-100">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}

export function ProfileStatsGrid({ stats }: ProfileStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Memes" value={stats.totalMemes} />
      <StatCard label="Karma" value={stats.totalKarma} />
      <StatCard
        label="Avg Score"
        value={Number.isFinite(stats.avgScore) ? stats.avgScore.toFixed(1) : "0"}
      />
      <StatCard label="Comments" value={stats.totalComments} />
    </div>
  );
}
