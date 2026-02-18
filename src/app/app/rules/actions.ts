"use server";

import { revalidatePath } from "next/cache";

import { addRule, deleteRule, toggleRule } from "@/lib/app/rules";
import { requireUserId } from "@/lib/session";

export async function addRuleAction(formData: FormData) {
  const userId = await requireUserId();
  const keyword = String(formData.get("keyword") ?? "");
  const feedIdRaw = String(formData.get("feedId") ?? "");
  const feedId = feedIdRaw.trim() ? feedIdRaw.trim() : null;
  await addRule(userId, keyword, feedId);
  revalidatePath("/app/rules");
}

export async function toggleRuleAction(formData: FormData) {
  const userId = await requireUserId();
  const ruleId = String(formData.get("ruleId") ?? "");
  await toggleRule(userId, ruleId);
  revalidatePath("/app/rules");
}

export async function deleteRuleAction(formData: FormData) {
  const userId = await requireUserId();
  const ruleId = String(formData.get("ruleId") ?? "");
  await deleteRule(userId, ruleId);
  revalidatePath("/app/rules");
}

