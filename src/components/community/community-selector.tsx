"use client";

interface CommunitySelectorProps {
  communities: { id: string; name: string; displayName: string }[];
  value: string;
  onChange: (communityId: string) => void;
  disabled?: boolean;
}

export function CommunitySelector({
  communities,
  value,
  onChange,
  disabled,
}: CommunitySelectorProps) {
  return (
    <div>
      <label
        htmlFor="community"
        className="mb-2 block font-mono text-sm text-zinc-400"
      >
        Community
      </label>
      <select
        id="community"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-base px-4 py-2.5 font-mono text-sm text-zinc-100 transition-colors focus:border-lavender/50 focus:outline-none disabled:opacity-50"
      >
        <option value="">None (post to main feed only)</option>
        {communities.map((c) => (
          <option key={c.id} value={c.id}>
            c/{c.name} — {c.displayName}
          </option>
        ))}
      </select>
      <p className="mt-1 font-mono text-xs text-zinc-600">
        Optional — memes always appear in the main feed too
      </p>
    </div>
  );
}
