import { listFeeds } from "@/lib/app/feeds";
import { addFeedAction, deleteFeedAction, toggleFeedAction } from "@/app/app/feeds/actions";
import { requireUserId } from "@/lib/session";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function FeedsPage() {
  const userId = await requireUserId();
  const items = await listFeeds(userId);

  return (
    <>
      <section className="page-h">
        <h2>Feeds</h2>
        <p className="muted">Manually add one or more RSS/Atom feed URLs.</p>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-h">
            <div className="card-t">Add Feed</div>
          </div>
          <div className="card-b">
            <form className="form" action={addFeedAction}>
              <label>
                <span>Name</span>
                <input name="name" placeholder="e.g. Security News" />
              </label>
              <label>
                <span>URL</span>
                <input name="url" placeholder="https://example.com/rss.xml" required />
              </label>
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-t">Current Feeds</div>
            <div className="muted">{items.length} total</div>
          </div>
          <div className="card-b">
            {items.length ? (
              <ul className="list">
                {items.map((f) => (
                  <li key={f.id} className="item">
                    <div className="item-top">
                      <div className="item-title-row">
                        <div className="item-title">{f.name}</div>
                        {f.enabled ? (
                          <span className="pill good">enabled</span>
                        ) : (
                          <span className="pill bad">paused</span>
                        )}
                      </div>
                      <div className="muted mono">{f.url}</div>
                    </div>
                    <div className="row">
                      <form action={toggleFeedAction}>
                        <input type="hidden" name="feedId" value={f.id} />
                        <button className="btn ghost" type="submit">
                          {f.enabled ? "Pause" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteFeedAction}>
                        <input type="hidden" name="feedId" value={f.id} />
                        <ConfirmButton className="btn danger" confirmText="Delete this feed?">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No feeds configured.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
