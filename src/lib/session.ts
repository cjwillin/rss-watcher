import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getUserIdByGoogleSub } from "@/lib/auth-user";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const googleSub = (session.user as unknown as { googleSub?: string }).googleSub;
  if (!googleSub) redirect("/api/auth/signin");

  const userId = await getUserIdByGoogleSub(googleSub);
  if (!userId) redirect("/api/auth/signin");
  return userId;
}

