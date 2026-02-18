export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ fontSize: 40, lineHeight: 1.1 }}>RSS Watcher</h1>
      <p style={{ marginTop: 12, opacity: 0.85 }}>
        Watch RSS/Atom feeds and get notified when items match your keywords.
      </p>

      <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/api/auth/signin">Sign in with Google</a>
        <a href="/app">Open app</a>
        <a href="/api/health">Health check</a>
      </div>

      <p style={{ marginTop: 18, opacity: 0.85 }}>
        Open signups (Google OAuth). After signing in, you will manage your own feeds and rules.
      </p>
    </main>
  );
}
