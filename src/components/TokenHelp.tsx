export function TokenHelp() {
  return (
    <details className="glow-card mt-4 p-5">
      <summary className="tap cursor-pointer font-bold">How to create a safe token</summary>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted">
        <li>On GitHub open Settings → Developer settings → Personal access tokens → Fine-grained tokens.</li>
        <li>Choose Generate new token and set Expiration to 30 days.</li>
        <li>Under Repository access pick “Public repositories (read-only)”.</li>
        <li>Add no permissions at all, then generate and paste the token here.</li>
      </ol>
      <p className="mt-3 text-sm">
        Use a fine-grained token with no write access. If you ever pasted a broader token, revoke it in GitHub settings.
      </p>
    </details>
  );
}
