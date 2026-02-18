"use client";

import { signIn } from "next-auth/react";

export function SignInCard({
  callbackUrl,
  testMode,
}: {
  callbackUrl: string;
  testMode: boolean;
}) {
  return (
    <div className="card lift" style={{ maxWidth: 560, margin: "24px auto 0" }}>
      <div className="card-h">
        <div className="card-t">Sign in</div>
        <div className="muted">Google OAuth</div>
      </div>
      <div className="card-b">
        <p className="muted" style={{ marginTop: 0 }}>
          Sign in to manage feeds, rules, and notification settings.
        </p>

        <div className="row" style={{ marginTop: 14 }}>
          <button
            className="btn"
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Continue with Google
          </button>

          {testMode ? (
            <button
              className="btn ghost"
              type="button"
              onClick={() =>
                signIn("credentials", {
                  callbackUrl,
                  username: "e2e",
                  password: "e2e",
                })
              }
            >
              Continue as test user
            </button>
          ) : null}
        </div>

        <div className="hint" style={{ marginTop: 10 }}>
          We only store what we need: your account and app configuration.
        </div>
      </div>
    </div>
  );
}

