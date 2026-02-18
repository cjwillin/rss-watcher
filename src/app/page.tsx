import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { requireUserId } from "@/lib/session";
import { getSettings } from "@/lib/app/settings";
import { listFeeds } from "@/lib/app/feeds";
import { listRules } from "@/lib/app/rules";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session?.user);

  let pollIntervalSeconds: number | null = null;
  let feedCount = 0;
  let ruleCount = 0;

  if (signedIn) {
    const userId = await requireUserId();
    const [s, feeds, rules] = await Promise.all([
      getSettings(userId),
      listFeeds(userId),
      listRules(userId),
    ]);
    pollIntervalSeconds = s.pollIntervalSeconds;
    feedCount = feeds.length;
    ruleCount = rules.length;
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Catch the moments that matter.</h1>
          <p className="lede">
            A calm RSS watcher that polls on a schedule and pings you when a keyword shows up.
          </p>

          <div className="chips" role="list">
            <div className="chip" role="listitem">
              <span className="chip-k">Interval</span>
              <span className="chip-v mono">
                {pollIntervalSeconds !== null ? `${pollIntervalSeconds}s` : "sign in"}
              </span>
            </div>
            <div className="chip" role="listitem">
              <span className="chip-k">Feeds</span>
              <span className="chip-v mono">{signedIn ? feedCount : "sign in"}</span>
            </div>
            <div className="chip" role="listitem">
              <span className="chip-k">Rules</span>
              <span className="chip-v mono">{signedIn ? ruleCount : "sign in"}</span>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="card lift">
            <div className="card-h">
              <div className="card-t">Quick Start</div>
              <div className="muted">3 steps</div>
            </div>
            <div className="card-b">
              <ol className="steps">
                <li>
                  <Link className="link" href="/app/feeds">
                    Add a feed
                  </Link>
                </li>
                <li>
                  <Link className="link" href="/app/rules">
                    Add a keyword rule
                  </Link>
                </li>
                <li>
                  <Link className="link" href="/app/settings">
                    Enable notifications
                  </Link>
                </li>
              </ol>
              <div className="hint">Pushover is the simplest iOS push option.</div>
              <div className="row">
                {signedIn ? (
                  <Link className="btn" href="/app/feeds">
                    Open app
                  </Link>
                ) : (
                  <Link className="btn" href="/signin">
                    Sign in
                  </Link>
                )}
                <Link className="btn ghost" href="/api/health">
                  Health
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-h">
            <div className="card-t">Recent Alerts</div>
            <div className="muted">coming soon</div>
          </div>
          <div className="card-b">
            <div className="empty">
              Alerts appear here once the scheduled poller is enabled. For now, you can configure feeds,
              rules, and notification settings.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-t">Your Setup</div>
            <div className="muted">{signedIn ? "ready" : "sign in"}</div>
          </div>
          <div className="card-b">
            <ul className="mini">
              <li className="mini-item">
                <div className="mini-name">Feeds</div>
                <div className="mini-meta">
                  <span className={`pill ${signedIn && feedCount ? "good" : ""}`}>
                    {signedIn ? `${feedCount} configured` : "sign in"}
                  </span>
                </div>
              </li>
              <li className="mini-item">
                <div className="mini-name">Rules</div>
                <div className="mini-meta">
                  <span className={`pill ${signedIn && ruleCount ? "good" : ""}`}>
                    {signedIn ? `${ruleCount} configured` : "sign in"}
                  </span>
                </div>
              </li>
              <li className="mini-item">
                <div className="mini-name">Notifications</div>
                <div className="mini-meta">
                  <span className="pill">configure in Settings</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
