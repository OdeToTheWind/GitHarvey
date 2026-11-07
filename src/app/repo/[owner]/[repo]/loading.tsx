import { SearchingNotice } from "@/components/SearchingNotice";

export default function Loading() {
  return <SearchingNotice title="Loading the repo…" text="Reading its details from GitHub. This can take a few seconds." />;
}
