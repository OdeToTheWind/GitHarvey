import Link from "next/link";
import { Cat } from "@/components/Cat";

export default function NotFound() {
  return (
    <main className="w-full px-5 sm:px-8 lg:px-12 pb-16">
      <Cat name="archived" size={88} />
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-4 text-muted">That page does not exist.</p>
      <Link href="/" className="btn-primary mt-6">Go home</Link>
    </main>
  );
}
