import { listLogs } from "@/lib/app/logs";
import { clearLogsAction } from "@/app/app/logs/actions";
import { requireUserId } from "@/lib/session";

export default async function LogsPage() {
  const userId = await requireUserId();
  const rows = await listLogs(userId);

  return (
    <main style={{ padding: 24 }}>
      <h1>Logs</h1>

      <form action={clearLogsAction} style={{ marginTop: 12 }}>
        <button type="submit">Clear logs</button>
      </form>

      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        {rows.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>
                {r.level} · {r.area}
              </strong>
              <span style={{ opacity: 0.8 }}>{String(r.ts)}</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{r.message}</div>
            {r.entryLink && (
              <a href={r.entryLink} target="_blank" rel="noreferrer">
                {r.entryLink}
              </a>
            )}
            {r.error && (
              <pre style={{ whiteSpace: "pre-wrap", opacity: 0.85, fontSize: 12 }}>{r.error}</pre>
            )}
          </div>
        ))}
        {!rows.length && <p style={{ opacity: 0.85 }}>No logs yet.</p>}
      </div>
    </main>
  );
}
