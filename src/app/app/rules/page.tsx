import { listFeeds } from "@/lib/app/feeds";
import { listRules } from "@/lib/app/rules";
import { addRuleAction, deleteRuleAction, toggleRuleAction } from "@/app/app/rules/actions";
import { requireUserId } from "@/lib/session";

export default async function RulesPage() {
  const userId = await requireUserId();
  const [rules, feeds] = await Promise.all([listRules(userId), listFeeds(userId)]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Rules</h1>

      <form action={addRuleAction} style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="keyword" placeholder="keyword (case-insensitive substring)" style={{ minWidth: 280 }} />
        <select name="feedId" defaultValue="">
          <option value="">All feeds</option>
          {feeds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        {rules.map((r) => (
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
              <strong>{r.keyword}</strong>
              <span style={{ opacity: 0.8 }}>
                {r.enabled ? "enabled" : "disabled"} · {r.feedId ? `feed: ${r.feedName ?? "?"}` : "all feeds"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <form action={toggleRuleAction}>
                <input type="hidden" name="ruleId" value={r.id} />
                <button type="submit">{r.enabled ? "Disable" : "Enable"}</button>
              </form>
              <form action={deleteRuleAction}>
                <input type="hidden" name="ruleId" value={r.id} />
                <button type="submit">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {!rules.length && <p style={{ opacity: 0.85 }}>No rules yet.</p>}
      </div>
    </main>
  );
}
