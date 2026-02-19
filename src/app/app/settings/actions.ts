"use server";

import { revalidatePath } from "next/cache";

import { saveSettings } from "@/lib/app/settings";
import { requireUserId } from "@/lib/session";

export async function saveSettingsAction(formData: FormData) {
  const userId = await requireUserId();

  const pollIntervalSeconds = Number(formData.get("pollIntervalSeconds") ?? 300);

  const clearPushover = String(formData.get("clearPushover") ?? "") === "1";
  const clearSmtp = String(formData.get("clearSmtp") ?? "") === "1";

  await saveSettings(userId, {
    pollIntervalSeconds,
    pushoverAppToken: String(formData.get("pushoverAppToken") ?? ""),
    pushoverUserKey: String(formData.get("pushoverUserKey") ?? ""),
    smtpHost: String(formData.get("smtpHost") ?? ""),
    smtpPort: String(formData.get("smtpPort") ?? ""),
    smtpUser: String(formData.get("smtpUser") ?? ""),
    smtpPass: String(formData.get("smtpPass") ?? ""),
    smtpFrom: String(formData.get("smtpFrom") ?? ""),
    smtpTo: String(formData.get("smtpTo") ?? ""),
    clearPushover,
    clearSmtp,
  });

  revalidatePath("/app/settings");
}

