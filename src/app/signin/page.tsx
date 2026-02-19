import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { SignInCard } from "@/components/SignInCard";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/app");

  const testMode = process.env.E2E_TEST_MODE === "1";

  return (
    <>
      <section className="page-h">
        <h2>Welcome back</h2>
        <p className="muted">
          Sign in to configure your watcher. If you are just exploring, start with the landing page.
        </p>
      </section>

  <SignInCard callbackUrl="/app" testMode={testMode} />
    </>
  );
}
