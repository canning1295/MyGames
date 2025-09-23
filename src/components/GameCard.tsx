import type { GameMetadata } from "@/core/game-types";

interface GameCardProps {
  readonly metadata: GameMetadata;
  readonly onLaunch: () => void;
}

export default function GameCard({ metadata, onLaunch }: GameCardProps) {
  return (
    <button
      type="button"
      onClick={onLaunch}
      className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background/60 text-left shadow-sm transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.99]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-foreground/10">
        <img
          src={metadata.cover}
          alt=""
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{metadata.title}</h2>
          <p className="text-sm text-foreground/70">{metadata.description}</p>
        </div>
        {metadata.tags && metadata.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {metadata.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}
