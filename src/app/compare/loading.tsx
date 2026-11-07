import { SearchingNotice } from "@/components/SearchingNotice";

export default function Loading() {
  return <SearchingNotice title="Comparing repos…" text="Reading each repo from GitHub. This can take a few seconds." />;
}
