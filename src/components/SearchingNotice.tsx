import { Cat } from "./Cat";

/** Shown while a page waits for GitHub, so a slow answer never looks like a frozen page. */
export function SearchingNotice({ title, text }: { title: string; text: string }) {
  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12" aria-busy="true">
      <Cat name="search" size={88} />
      <h1 className="text-4xl">{title}</h1>
      <p role="status" className="mt-4 text-muted">
        <span aria-hidden="true" className="mr-2 inline-block animate-pulse text-neon">●</span>
        {text}
      </p>
    </main>
  );
}
