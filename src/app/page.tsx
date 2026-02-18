import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { SIGN_IN_PATH } from "@/lib/paths";
import { IllusInbox, IllusSignal } from "@/components/Illustrations";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session?.user);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Catch the moments that matter.</h1>
          <p className="lede">
            RSS Watcher quietly scans your feeds in the background and pings you when a keyword shows up.
            No dashboards for dashboards’ sake. Just signal.
          </p>

          <div className="row" style={{ marginTop: 16 }}>
            {signedIn ? (
              <Link className="btn" href="/app/feeds">
                Open app
              </Link>
            ) : (
              <Link className="btn" href={SIGN_IN_PATH}>
                Sign in
              </Link>
            )}
            <div className="chip" role="note" aria-label="Product posture">
              <span className="chip-k">Posture</span>
              <span className="chip-v">boring, reliable, fast</span>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="card lift illus">
            <IllusSignal />
          </div>
        </div>
      </section>

      <section className="mkt">
        <div className="mkt-grid">
          <div className="card">
            <div className="card-h">
              <div className="card-t">How it works</div>
              <div className="muted">3 steps</div>
            </div>
            <div className="card-b">
              <ol className="steps">
                <li>Add your RSS or Atom feeds</li>
                <li>Create keyword rules (global or per-feed)</li>
                <li>Get notified when the keyword appears</li>
              </ol>
              <div className="hint">Pushover is the simplest iOS push option.</div>
            </div>
          </div>

          <div className="card illus">
            <IllusInbox />
          </div>
        </div>
      </section>

      <section className="mkt">
        <div className="grid">
          <div className="card">
            <div className="card-h">
              <div className="card-t">Calm by default</div>
            </div>
            <div className="card-b">
              <p className="muted" style={{ marginTop: 0 }}>
                No noise. No feed reader replacement. Just the handful of matches you actually care about.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div className="card-t">Rule scoping</div>
            </div>
            <div className="card-b">
              <p className="muted" style={{ marginTop: 0 }}>
                Apply a keyword across all feeds or keep it tied to one feed. Simple substring matches, on
                purpose.
              </p>
            </div>
          </div>

          <div className="card wide">
            <div className="card-h">
              <div className="card-t">Built for “set and forget”</div>
              <div className="muted">and “audit later”</div>
            </div>
            <div className="card-b">
              <div className="cols">
                <div>
                  <div className="k">Logs</div>
                  <div className="muted">See recent events and failures without tailing servers.</div>
                </div>
                <div>
                  <div className="k">Encrypted secrets</div>
                  <div className="muted">Notification credentials are stored encrypted per-user.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
