import { listDueUsers } from "@/lib/poller/store";
import type { PollUser } from "@/lib/poller/types";

export async function getDueUsers(now = new Date()): Promise<PollUser[]> {
  return listDueUsers(now);
}
