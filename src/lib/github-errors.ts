import "server-only";

// Error messages are static on purpose: they must never contain the token,
// the Authorization header, or any request detail.
export class GitHubError extends Error {
  readonly status: number;
  constructor(status: number, message = "GitHub request failed.") {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}
export class GitHubAuthError extends GitHubError {
  constructor() {
    super(401, "GitHub rejected the token.");
    this.name = "GitHubAuthError";
  }
}
export class GitHubRateLimitError extends GitHubError {
  readonly resetAt: string | null;
  constructor(resetAt: string | null) {
    super(429, "GitHub rate limit reached.");
    this.name = "GitHubRateLimitError";
    this.resetAt = resetAt;
  }
}
export class GitHubNotFoundError extends GitHubError {
  constructor() {
    super(404, "Not found on GitHub.");
    this.name = "GitHubNotFoundError";
  }
}
export class GitHubNetworkError extends GitHubError {
  constructor() {
    super(0, "Could not reach GitHub.");
    this.name = "GitHubNetworkError";
  }
}
