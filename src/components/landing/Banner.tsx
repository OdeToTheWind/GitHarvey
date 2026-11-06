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

/** Animated brand banner. Pure CSS motion, switched off by prefers-reduced-motion. */
export function Banner() {
  return (
    <section aria-label="GitHarvey" className="glow-card overflow-hidden">
      <div className="px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <p className="brand-name text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
          <span className="sr-only">{BRAND}</span>
          {BRAND.split("").map((letter, i) => (
            <span key={i} aria-hidden="true" className="brand-letter" style={{ animationDelay: `${i * 0.09}s` }}>
              {letter}
            </span>
          ))}
          <span aria-hidden="true" className="brand-cursor text-neon">_</span>
        </p>
        <p className="brand-tagline mt-4 text-muted">From a thousand repos to the right one.</p>
      </div>
      {/* Second row: the five steps, still until hovered, then they move in. */}
      <div className="scene-row mt-10 border-t border-line px-5 py-12 sm:px-8">
        <ul className="mx-auto flex max-w-5xl flex-wrap items-end justify-center gap-x-4 gap-y-8">
          {SCENE.map((item, i) => (
            <li key={item.caption} className="flex items-end">
              <span className="step flex flex-col items-center gap-1 px-3" style={{ animationDelay: `${i * 0.12}s` }}>
                <Cat name={item.icon} size={96} />
                <span className="text-sm text-muted">{item.caption}</span>
              </span>
              {i < SCENE.length - 1 && (
                <span aria-hidden="true" className="step hidden pb-8 text-2xl text-neon lg:block" style={{ animationDelay: `${i * 0.12 + 0.06}s` }}>
                  →
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
