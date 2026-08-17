import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  applications,
  cycles,
  type Application,
  type Cycle,
  statusEnum,
} from "@/lib/db/schema";

export type ApplicationStatus = (typeof statusEnum.enumValues)[number];

export type ApplicationStats = {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
};

const EMPTY_STATUS_COUNTS: Record<ApplicationStatus, number> = {
  Applied: 0,
  "OA/Assessment": 0,
  Interviewing: 0,
  Offer: 0,
  Rejected: 0,
};

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
    return { total: 0, byStatus: { ...EMPTY_STATUS_COUNTS } };
  }

  const rows = await db
    .select({
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .where(
      and(eq(applications.userId, userId), eq(applications.cycleId, cycleId))
    )
    .groupBy(applications.status);

  const byStatus = { ...EMPTY_STATUS_COUNTS };
  let total = 0;

  for (const row of rows) {
    byStatus[row.status] = row.count;
    total += row.count;
  }

  return { total, byStatus };
}
