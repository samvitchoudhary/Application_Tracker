import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  applications,
  cycles,
  type Application,
  type Cycle,
} from "@/lib/db/schema";
import {
  furthestStage,
  INTERVIEW_STAGES,
  isNegativeOutcome,
} from "@/lib/stages";

export type ApplicationStats = {
  total: number;
  active: number;
  reachedInterview: number;
  offers: number;
  accepted: number;
  rejected: number;
  ghosted: number;
};

const EMPTY_STATS: ApplicationStats = {
  total: 0,
  active: 0,
  reachedInterview: 0,
  offers: 0,
  accepted: 0,
  rejected: 0,
  ghosted: 0,
};

const INTERVIEW_STAGE_SET = new Set<string>(INTERVIEW_STAGES);

async function getOwnedCycle(userId: string, cycleId: string) {
  const [cycle] = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.id, cycleId), eq(cycles.userId, userId)))
    .limit(1);

  return cycle ?? null;
}

export async function getCycles(): Promise<Cycle[]> {
  const userId = await getUserId();

  return db
    .select()
    .from(cycles)
    .where(eq(cycles.userId, userId))
    .orderBy(desc(cycles.createdAt));
}

export async function getActiveCycle(): Promise<Cycle | null> {
  const userId = await getUserId();

  const userCycles = await db
    .select()
    .from(cycles)
    .where(eq(cycles.userId, userId))
    .orderBy(desc(cycles.createdAt));

  return userCycles.find((cycle) => cycle.isActive) ?? userCycles[0] ?? null;
}

export async function getApplications(cycleId: string): Promise<Application[]> {
  const userId = await getUserId();
  const cycle = await getOwnedCycle(userId, cycleId);

  if (!cycle) {
    return [];
  }

  return db
    .select()
    .from(applications)
    .where(
      and(eq(applications.userId, userId), eq(applications.cycleId, cycleId))
    )
    .orderBy(desc(applications.dateApplied), desc(applications.createdAt));
}

export async function getApplicationStats(
  cycleId: string
): Promise<ApplicationStats> {
  const userId = await getUserId();
  const cycle = await getOwnedCycle(userId, cycleId);

  if (!cycle) {
    return { ...EMPTY_STATS };
  }

  const rows = await db
    .select({
      currentStage: applications.currentStage,
      outcome: applications.outcome,
      stageEvents: applications.stageEvents,
    })
    .from(applications)
    .where(
      and(eq(applications.userId, userId), eq(applications.cycleId, cycleId))
    );

  const stats = { ...EMPTY_STATS };
  stats.total = rows.length;

  for (const row of rows) {
    const furthest = furthestStage(row.stageEvents ?? [], row.currentStage);

    if (row.outcome == null) {
      stats.active += 1;
    }

    if (
      INTERVIEW_STAGE_SET.has(furthest) &&
      !(row.outcome && isNegativeOutcome(row.outcome))
    ) {
      stats.reachedInterview += 1;
    }

    if (furthest === "Offer") {
      stats.offers += 1;
    }

    if (row.outcome === "Accepted") {
      stats.accepted += 1;
    }

    if (row.outcome === "Rejected") {
      stats.rejected += 1;
    }

    if (row.outcome === "Ghosted") {
      stats.ghosted += 1;
    }
  }

  return stats;
}
