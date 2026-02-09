import { MemeCard } from "./meme-card";
import type { FeedMeme } from "@/lib/validations/feed";

interface MemeGridProps {
  memes: FeedMeme[];
}

export function MemeGrid({ memes }: MemeGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}
