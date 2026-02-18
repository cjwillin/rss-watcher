"use server";

import { revalidatePath } from "next/cache";

import { addFeed, deleteFeed, toggleFeed } from "@/lib/app/feeds";
import { requireUserId } from "@/lib/session";

export async function addFeedAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "");
  const url = String(formData.get("url") ?? "");
  await addFeed(userId, name, url);
  revalidatePath("/app/feeds");
}

export async function toggleFeedAction(formData: FormData) {
  const userId = await requireUserId();
  const feedId = String(formData.get("feedId") ?? "");
  await toggleFeed(userId, feedId);
  revalidatePath("/app/feeds");
}

export async function deleteFeedAction(formData: FormData) {
  const userId = await requireUserId();
  const feedId = String(formData.get("feedId") ?? "");
  await deleteFeed(userId, feedId);
  revalidatePath("/app/feeds");
}

