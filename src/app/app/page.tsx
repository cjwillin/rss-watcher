import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { getOverviewStats, listRecentAlerts } from "@/lib/app/overview";

function fmtDate(value: Date | null): string {
  if (!value) return "never";
  return value.toLocaleString();
}

export default async function AppHomePage() {
  const userId = await requireUserId();
  const [stats, recentAlerts] = await Promise.all([getOverviewStats(userId), listRecentAlerts(userId)]);

  return (
    <>
      <section className="page-h">
        <h2>Overview</h2>
        <p className="muted">Live status for polling, alerts, and monitoring.</p>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-h">
            <div className="card-t">Polling</div>
          </div>
          <div className="card-b">
            <div className="k">Last poll</div>
            <div>{fmtDate(stats.lastPollAt)}</div>
            <div className="k" style={{ marginTop: 12 }}>
              Last poll error
            </div>
            <div>{fmtDate(stats.lastPollErrorAt)}</div>
            <div className="row">
              <Link className="btn ghost" href="/app/logs">
                Open logs
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-t">Rules & Feeds</div>
          </div>
          <div className="card-b">
            <div className="cols">
              <div>
                <div className="k">Feeds</div>
                <div>
                  {stats.enabledFeedCount} enabled / {stats.feedCount} total
                </div>
              </div>
              <div>
                <div className="k">Rules</div>
                <div>
                  {stats.enabledRuleCount} enabled / {stats.ruleCount} total
                </div>
              </div>
            </div>
            <div className="k" style={{ marginTop: 12 }}>
              Alerts (24h)
            </div>
            <div>{stats.alerts24h}</div>
          </div>
        </div>

        <div className="card wide">
          <div className="card-h">
            <div className="card-t">Recent Alerts</div>
            <div className="muted">Last alert: {fmtDate(stats.lastAlertAt)}</div>
          </div>
          <div className="card-b">
            {recentAlerts.length ? (
              <ul className="list">
                {recentAlerts.map((a) => (
                  <li key={a.id} className="item">
                    <div className="item-top">
                      <div className="item-title-row">
                        <span className="tag">{a.keyword}</span>
                        <span className="muted mono">{a.createdAt.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="muted">{a.entryTitle}</div>
                    {a.entryLink ? (
                      <a className="link mono" href={a.entryLink} target="_blank" rel="noreferrer">
                        {a.entryLink}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No alerts yet. Add feeds and rules, then wait for polling to match.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
