import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getUserIdByGoogleSub } from "@/lib/auth-user";
import { SIGN_IN_PATH } from "@/lib/paths";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(SIGN_IN_PATH);

  const googleSub = (session.user as unknown as { googleSub?: string }).googleSub;
  if (!googleSub) redirect(SIGN_IN_PATH);

  const userId = await getUserIdByGoogleSub(googleSub);
  if (!userId) redirect(SIGN_IN_PATH);
  return userId;
}
