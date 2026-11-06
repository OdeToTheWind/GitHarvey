/** Licenses that let you reuse the code with few conditions. Used by scoring and by the licence label. */
export const PERMISSIVE = new Set([
  "MIT",
  "MIT-0",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Unlicense",
  "0BSD",
  "Zlib",
  "BSL-1.0",
  "CC0-1.0",
]);

export type LicenseKind = "permissive" | "weak-copyleft" | "strong-copyleft" | "restricted" | "custom" | "none";

const WEAK_PREFIXES = ["LGPL", "MPL", "EPL", "CDDL"];
const STRONG_PREFIXES = ["GPL", "AGPL"];
const RESTRICTED_PREFIXES = ["BUSL", "SSPL", "Elastic", "Commons-Clause", "PolyForm"];

const startsWithAny = (id: string, prefixes: string[]) => prefixes.some((p) => id.startsWith(p));

/** Groups an SPDX id (as GitHub reports it) into a plain-language kind. Information only, not legal advice. */
export function licenseKind(license: string | null): LicenseKind {
  if (!license) return "none";
  if (PERMISSIVE.has(license)) return "permissive";
  if (startsWithAny(license, WEAK_PREFIXES)) return "weak-copyleft";
  if (startsWithAny(license, STRONG_PREFIXES)) return "strong-copyleft";
  if (startsWithAny(license, RESTRICTED_PREFIXES)) return "restricted";
  return "custom";
}

export const LICENSE_LABELS: Record<LicenseKind, string> = {
  permissive: "Permissive",
  "weak-copyleft": "Weak copyleft",
  "strong-copyleft": "Strong copyleft",
  restricted: "Source-available (restricted)",
  custom: "Custom or unclear",
  none: "No license",
};

export const LICENSE_NOTES: Record<LicenseKind, string> = {
  permissive: "Usually fine in closed-source products if you keep the notice.",
  "weak-copyleft": "Changes to the library itself must stay open. Using it from your own code is often fine.",
  "strong-copyleft": "Can require you to open your own code if you distribute it (AGPL: also when offered over a network).",
  restricted: "Not open source. Read the terms before using it commercially.",
  custom: "Read the license text to see what you may do.",
  none: "No license means all rights reserved: you have no permission to reuse the code.",
};
