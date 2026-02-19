import { getLogSummary, listLogs } from "@/lib/app/logs";
import { clearLogsAction } from "@/app/app/logs/actions";
import { requireUserId } from "@/lib/session";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function LogsPage() {
  const userId = await requireUserId();
  const [rows, summary] = await Promise.all([listLogs(userId), getLogSummary(userId)]);

  return (
    <>
      <section className="page-h">
        <h2>Logs</h2>
        <p className="muted">Recent debug events from polling and notification delivery.</p>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-h">
            <div className="card-t">Last 24h</div>
          </div>
          <div className="card-b">
            <div className="cols">
              <div>
                <div className="k">Total events</div>
                <div>{summary.total24h}</div>
              </div>
              <div>
                <div className="k">Errors</div>
                <div>{summary.errors24h}</div>
              </div>
            </div>
            <div className="k" style={{ marginTop: 12 }}>
              Notification failures
            </div>
            <div>{summary.notifyFailures24h}</div>
          </div>
        </div>

        <div className="card wide">
          <div className="card-h">
            <div className="card-t">Recent Events</div>
            <form action={clearLogsAction}>
              <ConfirmButton className="btn danger" confirmText="Clear all logs?">
                Clear
              </ConfirmButton>
            </form>
          </div>
          <div className="card-b">
            {rows.length ? (
              <div className="table">
                <div className="t-head">
                  <div>When</div>
                  <div>Level</div>
                  <div>Area</div>
                  <div>Message</div>
                  <div>Context</div>
                </div>
                {rows.map((r) => (
                  <details key={r.id} className={`t-row ${r.level === "error" ? "is-err" : ""}`}>
                    <summary className="t-sum">
                      <div className="mono">{String(r.ts)}</div>
                      <div>
                        <span className={`pill ${r.level === "error" ? "bad" : "good"}`}>{r.level}</span>
                      </div>
                      <div className="mono">{r.area}</div>
                      <div className="t-msg">{r.message}</div>
                      <div className="t-ctx">
                        {r.entryLink ? (
                          <a className="pill link" href={r.entryLink} target="_blank" rel="noreferrer">
                            open
                          </a>
                        ) : null}
                      </div>
                    </summary>
                    {r.error ? <pre className="pre">{r.error}</pre> : null}
                  </details>
                ))}
              </div>
            ) : (
              <div className="empty">No logs yet. Once polling is enabled, debug events will show up here.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
