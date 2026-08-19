import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

import type { StageEvent } from "../src/lib/stages";

function toDateString(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return null;
  }

  return value.slice(0, 10);
}

function isExactOldOaMapping(events: unknown): events is StageEvent[] {
  if (!Array.isArray(events) || events.length !== 2) {
    return false;
  }

  const applied = events.find((event) => event?.stage === "Applied");
  const recruiter = events.find((event) => event?.stage === "Recruiter Screen");
  const appliedDate = toDateString(applied?.date);
  const recruiterDate = toDateString(recruiter?.date);

  if (!applied || !recruiter || !appliedDate || !recruiterDate) {
    return false;
  }

  if (events.some((event) => event?.stage === "OA/Assessment")) {
    return false;
  }

  const otherStages = events.filter(
    (event) => event?.stage !== "Applied" && event?.stage !== "Recruiter Screen"
  );

  if (otherStages.length > 0) {
    return false;
  }

  return recruiterDate >= appliedDate;
}

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db");
  const { applications } = await import("../src/lib/db/schema");
  const { furthestStage } = await import("../src/lib/stages");

  const rows = await db
    .select({
      id: applications.id,
      company: applications.company,
      role: applications.role,
      stageEvents: applications.stageEvents,
    })
    .from(applications);

  let updated = 0;
  let skipped = 0;
  const companies: string[] = [];

  for (const row of rows) {
    if (!isExactOldOaMapping(row.stageEvents)) {
      skipped += 1;
      continue;
    }

    const stageEvents = row.stageEvents.map((event) =>
      event.stage === "Recruiter Screen"
        ? { ...event, stage: "OA/Assessment" }
        : event
    );
    const currentStage = furthestStage(stageEvents);

    await db
      .update(applications)
      .set({
        stageEvents,
        currentStage,
      })
      .where(eq(applications.id, row.id));

    updated += 1;
    companies.push(`${row.company} — ${row.role}`);
  }

  console.log(
    `OA stage fix complete: updated ${updated}, skipped ${skipped}, total ${rows.length}.`
  );

  if (companies.length > 0) {
    console.log("Updated companies:");
    for (const company of companies) {
      console.log(`  - ${company}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
