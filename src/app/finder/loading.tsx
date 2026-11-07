import { SearchingNotice } from "@/components/SearchingNotice";

export default function Loading() {
  return <SearchingNotice title="Searching GitHub…" text="Finding repos and scoring each one. This can take a few seconds." />;
}
