import "server-only";
import {
  GitHubAuthError,
  GitHubNetworkError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from "./github-errors";

export interface ErrorInfo {
  message: string;
  resetAt: string | null;
  /** True when the stored token was rejected and should be cleared. */
  badToken: boolean;
  notFound?: boolean;
}

/** Turns an error into user-facing text. Never includes request details. */
export function describeError(error: unknown): ErrorInfo {
  if (error instanceof GitHubAuthError) {
    return { message: "GitHub rejected your token. Add it again.", resetAt: null, badToken: true };
  }
  if (error instanceof GitHubRateLimitError) {
    return {
      message: "GitHub rate limit reached. Wait for the time below, or add your own token for a higher limit.",
      resetAt: error.resetAt,
      badToken: false,
    };
  }
  if (error instanceof GitHubNotFoundError) {
    return { message: "Not found on GitHub.", resetAt: null, badToken: false, notFound: true };
  }
  if (error instanceof GitHubNetworkError) {
    return { message: "Could not reach GitHub. Check your connection and try again.", resetAt: null, badToken: false };
  }
  return { message: "Something went wrong. Try again.", resetAt: null, badToken: false };
}
