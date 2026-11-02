import Link from "next/link";
import { ABOUT, TAGLINE } from "@/lib/site";
import { ExampleCard } from "./ExampleCard";

export function Hero() {
  return (
    <section className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl lg:leading-[1.05]">
          {TAGLINE}
        </h1>
        <p className="mt-5 max-w-2xl text-muted">{ABOUT}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/start" className="btn-primary">Get started</Link>
          <Link href="/compare" className="btn-secondary">Compare two repos</Link>
        </div>
      </div>
      <ExampleCard />
    </section>
  );
}
