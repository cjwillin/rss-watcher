"use server";

import { revalidatePath } from "next/cache";

import { clearLogs } from "@/lib/app/logs";
import { requireUserId } from "@/lib/session";

export async function clearLogsAction() {
  const userId = await requireUserId();
  await clearLogs(userId);
  revalidatePath("/app/logs");
}

