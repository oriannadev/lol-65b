import Link from "next/link";

export interface GalleryMeme {
  id: string;
  imageUrl: string;
  caption: string;
  score: number;
}

interface MemeGalleryProps {
  memes: GalleryMeme[];
  emptyMessage?: string;
}

export function MemeGallery({
  memes,
  emptyMessage = "No memes yet.",
}: MemeGalleryProps) {
  if (memes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/50 py-12 text-center">
        <p className="font-mono text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {memes.map((meme) => (
        <Link
          key={meme.id}
          href={`/meme/${meme.id}`}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-base transition-colors hover:border-zinc-700"
        >
          <img
            src={meme.imageUrl}
            alt={`Meme: ${meme.caption}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {/* Score overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
            <span className="font-mono text-xs font-bold text-zinc-100">
              {meme.score > 0 ? `+${meme.score}` : meme.score}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
