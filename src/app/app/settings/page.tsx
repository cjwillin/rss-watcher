import { getSettings } from "@/lib/app/settings";
import { saveSettingsAction } from "@/app/app/settings/actions";
import { requireUserId } from "@/lib/session";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const s = await getSettings(userId);

  return (
    <main style={{ padding: 24 }}>
      <h1>Settings</h1>

      <form action={saveSettingsAction} style={{ marginTop: 16, display: "grid", gap: 16, maxWidth: 680 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Poll interval (seconds, min 60)</span>
          <input
            name="pollIntervalSeconds"
            type="number"
            min={60}
            defaultValue={s.pollIntervalSeconds}
          />
        </label>

        <section style={{ border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: 12 }}>
          <h2 style={{ fontSize: 18 }}>Pushover</h2>
          <p style={{ opacity: 0.85, marginTop: 6 }}>
            Status: {s.pushoverConfigured ? "configured" : "not configured"}
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input name="pushoverAppToken" placeholder="App token" autoComplete="off" />
            <input name="pushoverUserKey" placeholder="User key" autoComplete="off" />
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="clearPushover" value="1" />
              <span>Clear stored Pushover credentials</span>
            </label>
          </div>
        </section>

        <section style={{ border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: 12 }}>
          <h2 style={{ fontSize: 18 }}>SMTP (Email)</h2>
          <p style={{ opacity: 0.85, marginTop: 6 }}>
            Status: {s.smtpConfigured ? "configured" : "not configured"}
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input name="smtpHost" placeholder="SMTP host" autoComplete="off" />
            <input name="smtpPort" placeholder="SMTP port (e.g. 587)" autoComplete="off" />
            <input name="smtpUser" placeholder="SMTP user (optional)" autoComplete="off" />
            <input name="smtpPass" placeholder="SMTP pass (optional)" autoComplete="off" />
            <input name="smtpFrom" placeholder="From (alerts@example.com)" autoComplete="off" />
            <input name="smtpTo" placeholder="To (you@example.com)" autoComplete="off" />
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="clearSmtp" value="1" />
              <span>Clear stored SMTP credentials</span>
            </label>
          </div>
        </section>

        <button type="submit">Save</button>
      </form>
    </main>
  );
}
