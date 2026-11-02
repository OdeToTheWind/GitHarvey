import type { CatName } from "@/lib/cat-icons";
import { Cat } from "../Cat";

export interface CardItem {
  icon: CatName;
  title: string;
  text: string;
}

/** A responsive grid of icon cards. Every picture is paired with a title and text. */
export function Cards({ id, heading, intro, items, columns = 3 }: {
  id: string;
  heading: string;
  intro?: string;
  items: CardItem[];
  columns?: 3 | 4;
}) {
  return (
    <section aria-labelledby={id} className="mt-28 sm:mt-40">
      <h2 id={id} className="text-2xl sm:text-3xl">{heading}</h2>
      {intro && <p className="mt-4 max-w-3xl text-muted">{intro}</p>}
      <ul className={`mt-12 grid gap-8 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {items.map((item) => (
          <li key={item.title} className="glow-card flex flex-col gap-4 p-8">
            <Cat name={item.icon} size={88} />
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
