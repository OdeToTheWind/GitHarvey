import { CAT_ICONS, type CatName } from "@/lib/cat-icons";

/** Decorative picture from Catgirl System Font. Always pair it with visible text. */
export function Cat({ name, size = 48 }: { name: CatName; size?: number }) {
  return (
    <span aria-hidden="true" className="cat" style={{ fontSize: size }}>
      {CAT_ICONS[name]}
    </span>
  );
}
