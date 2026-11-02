// Catgirl System Font draws a picture for each key. Each icon is always shown
// next to a text label, so the picture is decoration, never the only message.
export const CAT_ICONS = {
  search: "h", // cat with a magnifying glass
  score: "g", // chart with an exclamation mark
  compare: "m", // two cats side by side
  ranking: "w", // podium, number one
  token: "D", // shield against attacks
  questions: "o", // INPUT box
  healthy: "U", // STATUS OK
  archived: "Z", // sleeping
  beginner: "x", // cat carrying a kitten
  developer: "K", // at the terminal
  security: "E", // bug hunter with a net
  founder: "p", // input to output pipeline
  docs: "H", // reading a document
  selfhost: "N", // server rack
} as const;

export type CatName = keyof typeof CAT_ICONS;
