const REPO_NAME_RE = /^[\w.-]+\/[\w.-]+$/;

/** True for "owner/repo". Rejects "." and ".." segments (path traversal). */
export function isValidRepoName(name: string): boolean {
  if (!REPO_NAME_RE.test(name)) return false;
  const [owner, repo] = name.split("/");
  return !(
    owner === "." ||
    owner === ".." ||
    repo === "." ||
    repo === ".."
  );
}
