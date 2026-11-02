import Link from "next/link";
import { repoUrl, TAGLINE } from "@/lib/site";
import { Cat } from "./Cat";

const link = "tap underline-offset-4 hover:underline";

export function Footer() {
  const repo = repoUrl();
  return (
    <footer className="w-full border-t border-line px-5 py-16 text-sm text-muted sm:px-8 lg:px-12">
      <div className="grid gap-12 md:grid-cols-3 md:gap-16">
        <div>
          <Cat name="search" size={72} />
          <p className="mt-2 font-bold text-ink">GitHarvey</p>
          <p>{TAGLINE}</p>
        </div>
        <nav aria-label="Explore">
          <p className="font-bold text-ink">Explore</p>
          <ul className="mt-4 space-y-1">
            <li><Link href="/start" className={link}>Get started</Link></li>
            <li><Link href="/compare" className={link}>Compare repos</Link></li>
            <li><Link href="/privacy" className={link}>Privacy</Link></li>
            <li><Link href="/disclaimer" className={link}>Disclaimer</Link></li>
          </ul>
        </nav>
        <nav aria-label="Open source">
          <p className="font-bold text-ink">Open source</p>
          <ul className="mt-4 space-y-1">
            {repo ? (
              <>
                <li><a href={repo} rel="noopener noreferrer" className={link}>View the source on GitHub</a></li>
                <li><a href={`${repo}/issues`} rel="noopener noreferrer" className={link}>Report an issue</a></li>
                <li><a href={`${repo}/blob/main/docs/self-hosting.md`} rel="noopener noreferrer" className={link}>Host your own</a></li>
              </>
            ) : (
              <li>Free and open source, MIT licensed.</li>
            )}
          </ul>
        </nav>
      </div>
      <div className="mt-14 space-y-2 border-t border-line pt-8">
        <p>Free and open source (MIT). No database, no analytics, no ads.</p>
        <p>GitHarvey is not affiliated with GitHub. Repo data comes from the public GitHub API. <Link href="/disclaimer" className="underline underline-offset-4">Read the disclaimer</Link>.</p>
        <p>Fonts: CamingoCode by Jan Fromm (CC BY-ND 3.0) and Catgirl System Font.</p>
      </div>
    </footer>
  );
}
