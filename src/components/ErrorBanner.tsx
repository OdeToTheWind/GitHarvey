import type { ErrorInfo } from "@/lib/errors";
import { SignInLink } from "./SignInLink";
import { SignOutButton } from "./SignOutButton";

export function ErrorBanner({ info }: { info: ErrorInfo }) {
  return (
    <div aria-live="polite" className="glow-card mt-8 max-w-xl p-5">
      <p className="text-clay">{info.message}</p>
      {info.resetAt && (
        <p className="mt-1 text-sm text-muted">Try again after {new Date(info.resetAt).toUTCString()}.</p>
      )}
      {info.badToken && (
        <div className="mt-4 flex flex-wrap gap-3">
          <SignOutButton />
          <SignInLink />
        </div>
      )}
    </div>
  );
}
