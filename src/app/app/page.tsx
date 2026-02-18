import { requireUserId } from "@/lib/session";

export default async function AppHomePage() {
  await requireUserId();
  return (
    <main style={{ padding: 24 }}>
      <h1>RSS Watcher</h1>
      <p>Dashboard placeholder.</p>
    </main>
  );
}
