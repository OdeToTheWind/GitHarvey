/** Fetches our own API from the browser. Throws an Error with a safe, user-facing message. */
export async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store" });
  } catch {
    throw new Error("Could not reach the server. Try again.");
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Try again.");
  return body as T;
}
