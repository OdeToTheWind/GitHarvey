import Link from "next/link";
import { Cat } from "./Cat";

/** `next` is the page to come back to once the token is saved (an internal path only). */
export function NeedToken({ next }: { next?: string }) {
  const href = next ? `/start?next=${encodeURIComponent(next)}` : "/start";
  return (
    <div className="glow-card mt-8 max-w-xl p-5">
      <Cat name="token" size={88} />
      <p className="text-muted">Add a read-only GitHub token to search and score repos. You will come straight back here.</p>
      <Link href={href} className="btn-primary mt-4">Add a token</Link>
    </div>
  );
}
