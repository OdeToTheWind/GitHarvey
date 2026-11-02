const COLORS = { green: "#1b6b3a", yellow: "#7a5200", red: "#a33a28", gray: "#555555" } as const;
export type BadgeColor = keyof typeof COLORS;

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** A small flat SVG badge such as "GitHarvey | Healthy 82". Text is escaped; nothing else is interpolated. */
export function renderBadge(label: string, value: string, color: BadgeColor): string {
  const charW = 7;
  const left = label.length * charW + 14;
  const right = value.length * charW + 14;
  const width = left + right;
  const text = `${escapeXml(label)}: ${escapeXml(value)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${text}">
<title>${text}</title>
<rect width="${left}" height="20" fill="#222222"/>
<rect x="${left}" width="${right}" height="20" fill="${COLORS[color]}"/>
<g fill="#ffffff" font-family="ui-monospace,Menlo,monospace" font-size="11" text-anchor="middle">
<text x="${left / 2}" y="14">${escapeXml(label)}</text>
<text x="${left + right / 2}" y="14">${escapeXml(value)}</text>
</g>
</svg>`;
}
