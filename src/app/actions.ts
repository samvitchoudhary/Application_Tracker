"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  applications,
  cycles,
  priorityEnum,
  statusEnum,
  type Application,
  type Cycle,
  type NewApplication,
} from "@/lib/db/schema";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ApplicationWrite = {
  cycleId: string;
  company: string;
  role: string;
  locations?: string | null;
  link?: string | null;
  dateApplied?: string | null;
  status?: (typeof statusEnum.enumValues)[number];
  priority?: (typeof priorityEnum.enumValues)[number];
  notes?: string | null;
};

export type ApplicationPatch = Partial<ApplicationWrite>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = statusEnum.enumValues;
const PRIORITIES = priorityEnum.enumValues;

function isUuid(value: string) {
  return UUID_RE.test(value);
}

function isStatus(value: string): value is (typeof STATUSES)[number] {
  return (STATUSES as readonly string[]).includes(value);
}

function isPriority(value: string): value is (typeof PRIORITIES)[number] {
  return (PRIORITIES as readonly string[]).includes(value);
}

function requiredText(
  value: unknown,
  field: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: `${field} is required.` };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: `${field} is required.` };
  }

  return { ok: true, value: trimmed };
}

function optionalText(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ownedCycle(userId: string, cycleId: string) {
  const [cycle] = await db
    .select({ id: cycles.id })
    .from(cycles)
    .where(and(eq(cycles.id, cycleId), eq(cycles.userId, userId)))
    .limit(1);

  return cycle ?? null;
}

function parseApplicationWrite(
  data: ApplicationWrite
): { ok: false; error: string } | { ok: true; values: Omit<NewApplication, "userId"> } {
  if (typeof data.cycleId !== "string" || !isUuid(data.cycleId)) {
    return { ok: false, error: "A valid cycle is required." };
  }

  const company = requiredText(data.company, "Company");
  if (!company.ok) {
    return company;
  }

  const role = requiredText(data.role, "Role");
  if (!role.ok) {
    return role;
  }

  if (data.status !== undefined && !isStatus(data.status)) {
    return { ok: false, error: "Invalid status." };
  }

  if (data.priority !== undefined && !isPriority(data.priority)) {
    return { ok: false, error: "Invalid priority." };
  }

  if (
    data.dateApplied != null &&
    (typeof data.dateApplied !== "string" || !DATE_RE.test(data.dateApplied))
  ) {
    return { ok: false, error: "Date applied must be YYYY-MM-DD." };
  }

  return {
    ok: true,
    values: {
      cycleId: data.cycleId,
      company: company.value,
      role: role.value,
      locations: optionalText(data.locations),
      link: optionalText(data.link),
      notes: optionalText(data.notes),
      ...(data.dateApplied ? { dateApplied: data.dateApplied } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
    },
  };
}

export async function createApplication(
  data: ApplicationWrite
): Promise<ActionResult<Application>> {
  const userId = await getUserId();
  const parsed = parseApplicationWrite(data);

  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  const cycle = await ownedCycle(userId, parsed.values.cycleId);
  if (!cycle) {
    return { success: false, error: "Cycle not found." };
  }

  const [application] = await db
    .insert(applications)
    .values({ ...parsed.values, userId })
    .returning();

  if (!application) {
    return { success: false, error: "Failed to create application." };
  }

  revalidatePath("/");
  return { success: true, data: application };
}

export async function updateApplication(
  id: string,
  data: ApplicationPatch
): Promise<ActionResult<Application>> {
  const userId = await getUserId();

  if (!isUuid(id)) {
    return { success: false, error: "Application not found." };
  }

  const patch: Partial<NewApplication> = {};

  if (data.cycleId !== undefined) {
    if (!isUuid(data.cycleId)) {
      return { success: false, error: "A valid cycle is required." };
    }

    const cycle = await ownedCycle(userId, data.cycleId);
    if (!cycle) {
      return { success: false, error: "Cycle not found." };
    }

    patch.cycleId = data.cycleId;
  }

  if (data.company !== undefined) {
    const company = requiredText(data.company, "Company");
    if (!company.ok) {
      return { success: false, error: company.error };
    }
    patch.company = company.value;
  }

  if (data.role !== undefined) {
    const role = requiredText(data.role, "Role");
    if (!role.ok) {
      return { success: false, error: role.error };
    }
    patch.role = role.value;
  }

  if (data.locations !== undefined) {
    patch.locations = optionalText(data.locations);
  }

  if (data.link !== undefined) {
    patch.link = optionalText(data.link);
  }

  if (data.notes !== undefined) {
    patch.notes = optionalText(data.notes);
  }

  if (data.dateApplied !== undefined) {
    if (data.dateApplied != null && !DATE_RE.test(data.dateApplied)) {
      return { success: false, error: "Date applied must be YYYY-MM-DD." };
    }
    if (data.dateApplied) {
      patch.dateApplied = data.dateApplied;
    }
  }

  if (data.status !== undefined) {
    if (!isStatus(data.status)) {
      return { success: false, error: "Invalid status." };
    }
    patch.status = data.status;
  }

  if (data.priority !== undefined) {
    if (!isPriority(data.priority)) {
      return { success: false, error: "Invalid priority." };
    }
    patch.priority = data.priority;
  }

  const [application] = await db
    .update(applications)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();

  if (!application) {
    return { success: false, error: "Application not found." };
  }

  revalidatePath("/");
  return { success: true, data: application };
}

export async function deleteApplication(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();

  if (!isUuid(id)) {
    return { success: false, error: "Application not found." };
  }

  const [deleted] = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning({ id: applications.id });

  if (!deleted) {
    return { success: false, error: "Application not found." };
  }

  revalidatePath("/");
  return { success: true, data: deleted };
}

export async function createCycle(
  name: string
): Promise<ActionResult<Cycle>> {
  const userId = await getUserId();
  const parsedName = requiredText(name, "Cycle name");

  if (!parsedName.ok) {
    return { success: false, error: parsedName.error };
  }

  await db
    .update(cycles)
    .set({ isActive: false })
    .where(eq(cycles.userId, userId));

  const [cycle] = await db
    .insert(cycles)
    .values({
      userId,
      name: parsedName.value,
      isActive: true,
    })
    .returning();

  if (!cycle) {
    return { success: false, error: "Failed to create cycle." };
  }

  revalidatePath("/");
  return { success: true, data: cycle };
}

export async function setActiveCycle(
  cycleId: string
): Promise<ActionResult<Cycle>> {
  const userId = await getUserId();

  if (!isUuid(cycleId)) {
    return { success: false, error: "Cycle not found." };
  }

  const cycle = await ownedCycle(userId, cycleId);
  if (!cycle) {
    return { success: false, error: "Cycle not found." };
  }

  await db
    .update(cycles)
    .set({ isActive: false })
    .where(and(eq(cycles.userId, userId), ne(cycles.id, cycleId)));

  const [active] = await db
    .update(cycles)
    .set({ isActive: true })
    .where(and(eq(cycles.id, cycleId), eq(cycles.userId, userId)))
    .returning();

  if (!active) {
    return { success: false, error: "Cycle not found." };
  }

  revalidatePath("/");
  return { success: true, data: active };
}
