import { listFeeds } from "@/lib/app/feeds";
import { addFeedAction, deleteFeedAction, toggleFeedAction } from "@/app/app/feeds/actions";
import { requireUserId } from "@/lib/session";

export default async function FeedsPage() {
  const userId = await requireUserId();
  const items = await listFeeds(userId);

  return (
    <main style={{ padding: 24 }}>
      <h1>Feeds</h1>

      <form action={addFeedAction} style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="name" placeholder="Name" />
        <input name="url" placeholder="https://example.com/feed.xml" style={{ minWidth: 320 }} />
        <button type="submit">Add</button>
      </form>

      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        {items.map((f) => (
          <div
            key={f.id}
            style={{
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>{f.name}</strong>
              <span style={{ opacity: 0.8 }}>
                {f.enabled ? "enabled" : "disabled"} · {f.armed ? "armed" : "baselining"}
              </span>
            </div>
            <div style={{ opacity: 0.85, wordBreak: "break-word" }}>{f.url}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <form action={toggleFeedAction}>
                <input type="hidden" name="feedId" value={f.id} />
                <button type="submit">{f.enabled ? "Disable" : "Enable"}</button>
              </form>
              <form action={deleteFeedAction}>
                <input type="hidden" name="feedId" value={f.id} />
                <button type="submit">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {!items.length && <p style={{ opacity: 0.85 }}>No feeds yet.</p>}
      </div>
    </main>
  );
}
