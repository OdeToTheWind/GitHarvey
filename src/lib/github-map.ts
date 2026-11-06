import "server-only";
import type { RepoSummary } from "@/types";

// Raw GitHub shapes (only the fields we use) and their mapping to our types.
export interface RawRepo {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string | null } | null;
  pushed_at: string;
  created_at: string;
  topics?: string[];
  archived: boolean;
  homepage: string | null;
  size?: number;
}
export interface RawSearch {
  items: RawRepo[];
}
export interface RawRelease {
  published_at: string | null;
  created_at?: string;
}
export interface RawPull {
  created_at: string;
  merged_at: string | null;
}
export interface RawWeek {
  total: number;
}
export interface RawContent {
  content?: string;
  encoding?: string;
}
export interface RawCount {
  total_count: number;
}

export function mapRepo(raw: RawRepo): RepoSummary {
  const spdx = raw.license?.spdx_id ?? null;
  return {
    id: raw.id,
    fullName: raw.full_name,
    description: raw.description,
    url: raw.html_url,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count,
    language: raw.language,
    license: raw.license ? (spdx && spdx !== "NOASSERTION" ? spdx : "Other") : null,
    pushedAt: raw.pushed_at,
    createdAt: raw.created_at,
    topics: raw.topics ?? [],
    archived: raw.archived,
    homepage: raw.homepage ? raw.homepage : null,
    sizeKb: raw.size ?? 0,
  };
}
