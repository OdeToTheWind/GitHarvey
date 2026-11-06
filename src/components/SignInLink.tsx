import { signInHref } from "@/lib/links";
import { GitHubMark } from "./GitHubMark";

/**
 * "Sign in with GitHub". A plain link on purpose: the address redirects to github.com, so it must
 * not be prefetched or handled by the client router.
 */
export function SignInLink({ next, className = "btn-primary" }: { next?: string | null; className?: string }) {
  return (
    <a href={signInHref(next)} className={`${className} inline-flex items-center gap-2`}>
      <GitHubMark />
      Sign in with GitHub
    </a>
  );
}
