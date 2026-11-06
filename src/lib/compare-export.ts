export interface ExportTable {
  heads: string[]; // first cell is the corner, then one per repo
  rows: { label: string; cells: string[] }[];
}

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

/** A GitHub-flavoured Markdown table, ready to paste into a README, issue or doc. */
export function toMarkdown(table: ExportTable): string {
  const cell = (text: string) => oneLine(text).replace(/\|/g, "\\|");
  const line = (cells: string[]) => `| ${cells.map(cell).join(" | ")} |`;
  return [
    line(table.heads),
    line(table.heads.map(() => "---")),
    ...table.rows.map((r) => line([r.label, ...r.cells])),
  ].join("\n");
}

/**
 * One CSV cell. Text starting with = + - @ is prefixed with a quote so spreadsheets never run it
 * as a formula (repo descriptions come from strangers).
 */
export function csvCell(text: string): string {
  const flat = oneLine(text);
  const safe = /^[=+\-@]/.test(flat) ? `'${flat}` : flat;
  return /[",]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(table: ExportTable): string {
  const line = (cells: string[]) => cells.map(csvCell).join(",");
  return [line(table.heads), ...table.rows.map((r) => line([r.label, ...r.cells]))].join("\n");
}
