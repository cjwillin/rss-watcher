import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session?.user);

  return (
    <>
      <div className="bg" aria-hidden="true" />

      <header className="top" role="banner">
        <div className="top-in">
          <Link className="brand" href="/">
            <span className="mark" aria-hidden="true">
              <span className="mark-dot" />
            </span>
            <span className="brand-txt">
              <span className="brand-name">RSS Watcher</span>
              <span className="brand-sub">keyword alerts, quietly</span>
            </span>
          </Link>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {signedIn ? <Nav /> : null}
            {signedIn ? (
              <Link className="navlink" href="/api/auth/signout">
                Sign out
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="wrap">
        {children}
        <footer className="foot">
          <div className="foot-in">
            <div className="muted">Polling runs on Vercel Cron. Alerts de-dupe per item and rule.</div>
            <div className="muted">Built to be boring, reliable, and fast.</div>
          </div>
        </footer>
      </main>
    </>
  );
}
