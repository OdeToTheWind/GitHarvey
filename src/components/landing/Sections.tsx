import Link from "next/link";
import { Cat } from "../Cat";
import { Cards } from "./Cards";

export function Features() {
  return (
    <Cards
      id="features-h"
      heading="Search that shows its working, not just stars"
      intro="GitHub search ranks by stars and stops there. GitHarvey adds a health score and shows how every point was earned."
      items={[
        { icon: "score", title: "A health score", text: "Every repo gets 0 to 100 from how recently it was updated, its license, docs, popularity and releases. The reasons are shown." },
        { icon: "compare", title: "Side-by-side comparison", text: "Pick two or three repos and see them in one table, with the best value in each row marked." },
        { icon: "ranking", title: "Reasons you can read", text: "Every score has a \"Why this score\" panel listing each signal and the points it added, so you can judge the number yourself." },
      ]}
    />
  );
}

export function Audiences() {
  return (
    <Cards
      id="audience-h"
      heading="Made for whoever you are"
      intro="Your answers change what counts. A beginner values docs, a security reader values recent updates, a founder values the license."
      columns={4}
      items={[
        { icon: "beginner", title: "Beginners", text: "Learning resources and projects with good docs." },
        { icon: "developer", title: "Developers", text: "Maintained tools and libraries you can build on." },
        { icon: "security", title: "Security-minded", text: "Actively updated tools, with the license and risk shown." },
        { icon: "founder", title: "Founders", text: "Permissive licenses and projects you can ship with." },
      ]}
    />
  );
}

const STEPS = [
  { icon: "token", title: "Add a read-only token", text: "It stays in an encrypted cookie and goes only to GitHub." },
  { icon: "questions", title: "Answer four questions", text: "Who you are, your goal, a topic and what matters most." },
  { icon: "ranking", title: "Get ranked repos", text: "Scored results, comparisons and a page you can come back to." },
] as const;

export function Steps() {
  return (
    <section aria-labelledby="how-h" className="mt-16">
      <h2 id="how-h" className="text-2xl sm:text-3xl">How it works</h2>
      <ol className="mt-6 grid gap-5 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="glow-card flex flex-col gap-2 p-5">
            <Cat name={s.icon} size={88} />
            <p className="text-sm text-muted">Step {i + 1}</p>
            <h3 className="font-bold">{s.title}</h3>
            <p className="text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="glow-card mt-16 flex flex-wrap items-center justify-between gap-6 p-8">
      <div>
        <Cat name="search" size={88} />
        <h2 className="text-2xl">Ready to find yours?</h2>
        <p className="text-muted">Free for everyone. Open source. No database.</p>
      </div>
      <Link href="/start" className="btn-primary">Get started</Link>
    </section>
  );
}
