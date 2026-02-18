import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/app">Dashboard</Link>
          <Link href="/app/feeds">Feeds</Link>
          <Link href="/app/rules">Rules</Link>
          <Link href="/app/settings">Settings</Link>
          <Link href="/app/logs">Logs</Link>
        </nav>
        <a href="/api/auth/signout">Sign out</a>
      </header>
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

