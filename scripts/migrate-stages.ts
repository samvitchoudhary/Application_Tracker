import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

import type { Outcome, Stage, StageEvent } from "../src/lib/stages";

type LegacyStatus =
  | "Applied"
  | "OA/Assessment"
  | "Interviewing"
  | "Offer"
  | "Rejected";

function toDateString(value: string | Date): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function event(stage: Stage, date: string): StageEvent {
  return { stage, date };
}

function mapFromStatus(
  status: string,
  dateApplied: string
): { currentStage: Stage; outcome: Outcome | null; stageEvents: StageEvent[] } {
  switch (status as LegacyStatus) {
    case "Applied":
      return {
        currentStage: "Applied",
        outcome: null,
        stageEvents: [event("Applied", dateApplied)],
      };
    case "OA/Assessment":
      return {
        currentStage: "Recruiter Screen",
        outcome: null,
        stageEvents: [
          event("Applied", dateApplied),
          event("Recruiter Screen", dateApplied),
        ],
      };
    case "Interviewing":
      return {
        currentStage: "First Interview",
        outcome: null,
        stageEvents: [
          event("Applied", dateApplied),
          event("First Interview", dateApplied),
        ],
      };
    case "Offer":
      return {
        currentStage: "Offer",
        outcome: null,
        stageEvents: [event("Applied", dateApplied), event("Offer", dateApplied)],
      };
    case "Rejected":
      return {
        currentStage: "Applied",
        outcome: "Rejected",
        stageEvents: [event("Applied", dateApplied)],
      };
    default:
      throw new Error(`Unrecognized status: ${status}`);
  }
}

function hasStageHistory(stageEvents: unknown): boolean {
  return Array.isArray(stageEvents) && stageEvents.length > 0;
}

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db");
  const { applications } = await import("../src/lib/db/schema");

  const rows = await db.select().from(applications);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (hasStageHistory(row.stageEvents)) {
      skipped += 1;
      continue;
    }

    const mapped = mapFromStatus(row.status, toDateString(row.dateApplied));

    await db
      .update(applications)
      .set({
        currentStage: mapped.currentStage,
        outcome: mapped.outcome,
        stageEvents: mapped.stageEvents,
      })
      .where(eq(applications.id, row.id));

    updated += 1;
  }

  console.log(
    `Stage migration complete: updated ${updated}, skipped ${skipped} (already had stageEvents), total ${rows.length}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
