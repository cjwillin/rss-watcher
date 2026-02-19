import { listFeeds } from "@/lib/app/feeds";
import { listRules } from "@/lib/app/rules";
import { addRuleAction, deleteRuleAction, toggleRuleAction } from "@/app/app/rules/actions";
import { requireUserId } from "@/lib/session";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function RulesPage() {
  const userId = await requireUserId();
  const [rules, feeds] = await Promise.all([listRules(userId), listFeeds(userId)]);

  return (
    <>
      <section className="page-h">
        <h2>Rules</h2>
        <p className="muted">
          A rule is a keyword substring match. You can scope it to a feed or apply globally.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-h">
            <div className="card-t">Add Rule</div>
          </div>
          <div className="card-b">
            <form className="form" action={addRuleAction}>
              <label>
                <span>Keyword</span>
                <input name="keyword" placeholder="e.g. ransomware" required />
              </label>
              <label>
                <span>Scope</span>
                <select name="feedId" defaultValue="">
                  <option value="">All feeds</option>
                  {feeds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-t">Current Rules</div>
            <div className="muted">{rules.length} total</div>
          </div>
          <div className="card-b">
            {rules.length ? (
              <ul className="list">
                {rules.map((r) => (
                  <li key={r.id} className="item">
                    <div className="item-top">
                      <div className="item-title-row">
                        <span className="tag">{r.keyword}</span>
                        {r.enabled ? (
                          <span className="pill good">enabled</span>
                        ) : (
                          <span className="pill bad">paused</span>
                        )}
                      </div>
                      <div className="muted">Scope: {r.feedName ?? "All feeds"}</div>
                    </div>
                    <div className="row">
                      <form action={toggleRuleAction}>
                        <input type="hidden" name="ruleId" value={r.id} />
                        <button className="btn ghost" type="submit">
                          {r.enabled ? "Pause" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteRuleAction}>
                        <input type="hidden" name="ruleId" value={r.id} />
                        <ConfirmButton className="btn danger" confirmText="Delete this rule?">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No rules configured.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
