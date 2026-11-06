const BAR = 3;
const HEIGHT = 32;

/** Commits per week as tiny bars. The label carries the meaning, so it works without sight. */
export function Sparkline({ weeks, label }: { weeks: number[]; label: string }) {
  const max = Math.max(1, ...weeks);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${weeks.length * BAR} ${HEIGHT}`} className="h-8 w-44 text-neon" fill="currentColor">
      {weeks.map((total, i) => {
        const h = total === 0 ? 1 : Math.max(2, (total / max) * HEIGHT);
        return <rect key={i} x={i * BAR} y={HEIGHT - h} width={BAR - 1} height={h} />;
      })}
    </svg>
  );
}
