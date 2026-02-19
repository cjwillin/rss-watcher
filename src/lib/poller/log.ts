import { getDb } from "@/db";
import { userLog } from "@/db/schema";

type LogInput = {
  userId: string;
  area: string;
  message: string;
  feedId?: string | null;
  ruleId?: string | null;
  entryLink?: string | null;
  error?: string | null;
};

async function write(level: "info" | "warn" | "error", input: LogInput) {
  const db = getDb();
  await db.insert(userLog).values({
    userId: input.userId,
    level,
    area: input.area,
    message: input.message,
    feedId: input.feedId ?? null,
    ruleId: input.ruleId ?? null,
    entryLink: input.entryLink ?? null,
    error: input.error ?? null,
  });
}

export async function logInfo(input: LogInput) {
  await write("info", input);
}

export async function logWarn(input: LogInput) {
  await write("warn", input);
}

export async function logError(input: LogInput) {
  await write("error", input);
}
