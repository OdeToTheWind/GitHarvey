import type { CatName } from "@/lib/cat-icons";
import { Cat } from "../Cat";

const BRAND = "GitHarvey";

// The product flow, told in pictures. Each picture has a caption in the readable font.
const SCENE: { icon: CatName; caption: string }[] = [
  { icon: "search", caption: "Search" },
  { icon: "score", caption: "Score" },
  { icon: "compare", caption: "Compare" },
  { icon: "ranking", caption: "Rank" },
  { icon: "healthy", caption: "Choose well" },
];

function Scene({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-end gap-10 pr-10" aria-hidden={hidden || undefined}>
      {SCENE.map((item, i) => (
        <li key={item.caption} className="flex items-end gap-10">
          <span className="flex flex-col items-center gap-1">
            <span className="cat-bob" style={{ animationDelay: `${i * 0.35}s` }}>
              <Cat name={item.icon} size={96} />
            </span>
            <span className="text-sm text-muted">{item.caption}</span>
          </span>
          <span className="pb-8 text-2xl text-neon" aria-hidden="true">→</span>
        </li>
      ))}
    </ul>
  );
}

/** Animated brand banner. Pure CSS motion, switched off by prefers-reduced-motion. */
export function Banner() {
  return (
    <section aria-label="GitHarvey" className="glow-card overflow-hidden">
      <div className="px-5 pt-8 sm:px-8 lg:px-12">
        <p className="brand-name text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl" aria-label={BRAND}>
          {BRAND.split("").map((letter, i) => (
            <span key={i} aria-hidden="true" className="brand-letter" style={{ animationDelay: `${i * 0.09}s` }}>
              {letter}
            </span>
          ))}
          <span aria-hidden="true" className="brand-cursor text-neon">_</span>
        </p>
        <p className="brand-tagline mt-2 text-muted">From a thousand repos to the right one.</p>
      </div>
      <div className="marquee mt-6 border-t border-line py-6">
        <p className="sr-only">Search, score, compare and rank GitHub repos.</p>
        <div className="marquee-track" aria-hidden="true">
          <Scene />
          <Scene hidden />
        </div>
      </div>
    </section>
  );
}
