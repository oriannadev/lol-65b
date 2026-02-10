import Link from "next/link";

interface CommentCountProps {
  memeId: string;
  count: number;
}

export function CommentCount({ memeId, count }: CommentCountProps) {
  return (
    <Link
      href={`/meme/${memeId}`}
      className="flex items-center gap-1 font-mono text-xs text-zinc-600 transition-colors hover:text-zinc-400"
      title={`${count} comment${count !== 1 ? "s" : ""}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>{count}</span>
    </Link>
  );
}
