import { repoLookup } from "@/lib/api";
import { loadDetails } from "@/lib/search";

// Never log the token or the request in this file.
export function GET(request: Request) {
  return repoLookup(request, (name, token) => loadDetails(name, token));
}
