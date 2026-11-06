import type { Metadata } from "next";
import { Cards } from "@/components/landing/Cards";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12">
      <h1 className="text-4xl">Privacy</h1>
      <p className="mt-5 max-w-3xl text-muted">Short and plain: here is what GitHarvey does with your data.</p>
      <Cards
        id="privacy-h"
        heading="Our promises"
        items={[
          { icon: "security", title: "Nothing to track you", text: "No database, no analytics, no ads, and no third-party scripts." },
          { icon: "token", title: "Your sign-in stays encrypted", text: "The access GitHub gives you lives in an httpOnly cookie and is used only to call api.github.com. It is never logged, cached, or put in a URL." },
          { icon: "docs", title: "Only public data is cached", text: "Cached GitHub data is public, and tokens never are." },
          { icon: "questions", title: "Your answers and saved repos stay in your browser", text: "Audience, goal, topic and the repos you save are kept locally so your page and shortlist can remember them. Clear them from Your page and Saved." },
          { icon: "score", title: "Read-only, nothing more", text: "GitHarvey asks GitHub for no permissions, so it can only read public data. Sign out any time, and revoke it in GitHub settings if you like." },
          { icon: "selfhost", title: "Open source", text: "Read the code, or self-host it so your sign-in never touches anyone else's server." },
        ]}
      />
    </main>
  );
}
