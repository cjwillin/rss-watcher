import { getSettings } from "@/lib/app/settings";
import { saveSettingsAction } from "@/app/app/settings/actions";
import { requireUserId } from "@/lib/session";
import Link from "next/link";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const s = await getSettings(userId);

  return (
    <>
      <section className="page-h">
        <h2>Settings</h2>
        <p className="muted">Secrets are stored encrypted at rest for your account.</p>
      </section>

      <section className="grid">
        <div className="card wide">
          <div className="card-h">
            <div className="card-t">General</div>
          </div>
          <div className="card-b">
            <form className="form" action={saveSettingsAction}>
              <div className="cols">
                <label>
                  <span>Poll interval (seconds)</span>
                  <input
                    name="pollIntervalSeconds"
                    type="number"
                    min={60}
                    defaultValue={s.pollIntervalSeconds}
                  />
                  <div className="hint">Minimum 60 seconds.</div>
                </label>
              </div>

              <div className="sep" />
              <div className="k">iOS push via Pushover</div>
              <div className="muted">
                Status: {s.pushoverConfigured ? "configured" : "not configured"}
              </div>
              <div className="cols">
                <label>
                  <span>App token</span>
                  <input name="pushoverAppToken" placeholder="Pushover application token" autoComplete="off" />
                </label>
                <label>
                  <span>User key</span>
                  <input name="pushoverUserKey" placeholder="Your Pushover user key" autoComplete="off" />
                </label>
              </div>
              <label style={{ marginTop: 6 }}>
                <span>Clear</span>
                <select name="clearPushover" defaultValue="0">
                  <option value="0">Keep existing</option>
                  <option value="1">Clear stored Pushover credentials</option>
                </select>
              </label>

              <div className="sep" />
              <div className="k">Email via SMTP</div>
              <div className="muted">
                Status: {s.smtpConfigured ? "configured" : "not configured"}
              </div>
              <div className="cols">
                <label>
                  <span>SMTP host</span>
                  <input name="smtpHost" placeholder="smtp.example.com" autoComplete="off" />
                </label>
                <label>
                  <span>SMTP port</span>
                  <input name="smtpPort" placeholder="587" autoComplete="off" />
                </label>
                <label>
                  <span>SMTP user</span>
                  <input name="smtpUser" placeholder="optional" autoComplete="off" />
                </label>
                <label>
                  <span>SMTP pass</span>
                  <input name="smtpPass" type="password" placeholder="optional" autoComplete="off" />
                </label>
                <label>
                  <span>From</span>
                  <input name="smtpFrom" placeholder="alerts@example.com" autoComplete="off" />
                </label>
                <label>
                  <span>To</span>
                  <input name="smtpTo" placeholder="you@example.com" autoComplete="off" />
                </label>
              </div>
              <label style={{ marginTop: 6 }}>
                <span>Clear</span>
                <select name="clearSmtp" defaultValue="0">
                  <option value="0">Keep existing</option>
                  <option value="1">Clear stored SMTP credentials</option>
                </select>
              </label>

              <div className="row">
                <button className="btn" type="submit">
                  Save
                </button>
                <Link className="btn ghost" href="/">
                  Back
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
