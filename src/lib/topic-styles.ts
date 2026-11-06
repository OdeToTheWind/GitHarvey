export const TOPIC_STYLES = ["starter kit", "boilerplate", "tutorial", "examples"] as const;

const MAX_TOPIC = 80;
const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

/** Adds a style word such as "starter kit" to the topic, or takes it out when it is already there. */
export function toggleStyle(topic: string, style: string): string {
  const words = collapse(topic);
  const at = words.toLowerCase().indexOf(style);
  if (at !== -1) return collapse(words.slice(0, at) + words.slice(at + style.length));
  const next = collapse(`${words} ${style}`);
  return next.length > MAX_TOPIC ? words : next;
}
