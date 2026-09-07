import type { AccentClasses } from "@/lib/status";

export const STAGES = [
  "Applied",
  "OA/Assessment",
  "Recruiter Screen",
  "First Interview",
  "Second Interview",
  "Third Interview",
  "Offer",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_INDEX = Object.fromEntries(
  STAGES.map((stage, index) => [stage, index])
) as Record<Stage, number>;

export function stageIndex(stage: Stage): number {
  return STAGE_INDEX[stage];
}

export const INTERVIEW_STAGES = [
  "First Interview",
  "Second Interview",
  "Third Interview",
] as const;

export const NEGATIVE_OUTCOMES = ["Ghosted", "Rejected"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

export function isOutcome(value: string): value is Outcome {
  return (OUTCOMES as readonly string[]).includes(value);
}

export function isOfferOnlyOutcome(
  value: Outcome
): value is (typeof OFFER_ONLY_OUTCOMES)[number] {
  return (OFFER_ONLY_OUTCOMES as readonly string[]).includes(value);
}

export function isNegativeOutcome(value: Outcome): boolean {
  return (NEGATIVE_OUTCOMES as readonly string[]).includes(value);
}

export function nextStage(current: Stage): Stage | null {
  const index = stageIndex(current);
  return index < STAGES.length - 1 ? STAGES[index + 1] : null;
}

export function furthestStage(
  events: readonly StageEvent[],
  fallback: Stage = "Applied"
): Stage {
  let furthest = fallback;

  for (const event of events) {
    if (!isStage(event.stage)) {
      continue;
    }

    if (stageIndex(event.stage) > stageIndex(furthest)) {
      furthest = event.stage;
    }
  }

  return furthest;
}

export function hasReachedOffer(
  events: readonly StageEvent[],
  current: Stage
): boolean {
  return stageIndex(furthestStage(events, current)) >= stageIndex("Offer");
}

export function sortStageEvents(events: StageEvent[]): StageEvent[] {
  return [...events].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) {
      return byDate;
    }

    const aIndex = isStage(a.stage) ? stageIndex(a.stage) : -1;
    const bIndex = isStage(b.stage) ? stageIndex(b.stage) : -1;
    return aIndex - bIndex;
  });
}

export function validateStageEvents(
  events: StageEvent[]
): { ok: true; events: StageEvent[]; currentStage: Stage } | { ok: false; error: string } {
  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, error: "At least one stage event is required." };
  }

  const normalized: StageEvent[] = [];

  for (const event of events) {
    if (!event || typeof event.stage !== "string" || !isStage(event.stage)) {
      return { ok: false, error: "Each history row needs a valid stage." };
    }

    if (typeof event.date !== "string" || !DATE_RE.test(event.date)) {
      return { ok: false, error: "Each history row needs a YYYY-MM-DD date." };
    }

    normalized.push({ stage: event.stage, date: event.date });
  }

  const sorted = sortStageEvents(normalized);

  return {
    ok: true,
    events: sorted,
    currentStage: furthestStage(sorted),
  };
}

export const OUTCOMES = ["Rejected", "Ghosted", "Accepted"] as const;

export type Outcome = (typeof OUTCOMES)[number];

/** Accepted is only valid after currentStage is Offer. */
export const OFFER_ONLY_OUTCOMES = ["Accepted"] as const;

export type StageEvent = {
  stage: string;
  date: string;
};

export const STAGE_CONFIG: Record<Stage, AccentClasses> = {
  Applied: {
    label: "Applied",
    className:
      "border-sky-400/45 bg-sky-400/15 text-sky-300",
    chartColor: "#38bdf8",
  },
  "OA/Assessment": {
    label: "OA/Assessment",
    className:
      "border-yellow-400/45 bg-yellow-400/15 text-yellow-300",
    chartColor: "#fbbf24",
  },
  "Recruiter Screen": {
    label: "Recruiter Screen",
    className:
      "border-blue-400/45 bg-blue-400/15 text-blue-300",
    chartColor: "#60a5fa",
  },
  "First Interview": {
    label: "First Interview",
    className:
      "border-orange-400/45 bg-orange-400/15 text-orange-300",
    chartColor: "#fb923c",
  },
  "Second Interview": {
    label: "Second Interview",
    className:
      "border-amber-400/45 bg-amber-400/15 text-amber-300",
    chartColor: "#fbbf24",
  },
  "Third Interview": {
    label: "Third Interview",
    className:
      "border-orange-400/45 bg-orange-400/15 text-orange-200",
    chartColor: "#fb923c",
  },
  Offer: {
    label: "Offer",
    className:
      "border-emerald-400/45 bg-emerald-400/15 text-emerald-300",
    chartColor: "#34d399",
  },
};

export const OUTCOME_CONFIG: Record<Outcome, AccentClasses> = {
  Ghosted: {
    label: "Ghosted",
    className:
      "border-slate-400/45 bg-slate-400/15 text-slate-300",
    chartColor: "#b0bcc9",
  },
  Rejected: {
    label: "Rejected",
    className:
      "border-rose-400/45 bg-rose-400/15 text-rose-300",
    chartColor: "#fb7185",
  },
  Accepted: {
    label: "Accepted",
    className:
      "border-green-400/45 bg-green-400/15 text-green-300",
    chartColor: "#4ade80",
  },
};
