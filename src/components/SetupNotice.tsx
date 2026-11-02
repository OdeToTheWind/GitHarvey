export function SetupNotice() {
  return (
    <div role="alert" className="glow-card mt-8 max-w-2xl p-5">
      <p className="font-bold text-clay">GitHarvey is not configured yet.</p>
      <p className="mt-2 text-muted">
        Set <code>SESSION_SECRET</code> (32 or more characters) in <code>.env.local</code>, then restart the server.
        Generate one with <code>openssl rand -base64 32</code>.
      </p>
    </div>
  );
}
