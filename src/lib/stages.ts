import type { AccentClasses } from "@/lib/status";

export const STAGES = [
  "Applied",
  "Recruiter Screen",
  "First Interview",
  "Second Interview",
  "Third Interview",
  "Offer",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_INDEX: Record<Stage, number> = {
  Applied: 0,
  "Recruiter Screen": 1,
  "First Interview": 2,
  "Second Interview": 3,
  "Third Interview": 4,
  Offer: 5,
};

export function stageIndex(stage: Stage): number {
  return STAGE_INDEX[stage];
}

export const OUTCOMES = [
  "No Reply",
  "Rejected",
  "Withdrew",
  "Accepted",
  "Declined",
] as const;

export type Outcome = (typeof OUTCOMES)[number];

/** Accepted and Declined are only valid after currentStage is Offer. */
export const OFFER_ONLY_OUTCOMES = ["Accepted", "Declined"] as const;

export type StageEvent = {
  stage: string;
  date: string;
};

export const STAGE_CONFIG: Record<Stage, AccentClasses> = {
  Applied: {
    label: "Applied",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    chartColor: "#0ea5e9",
  },
  "Recruiter Screen": {
    label: "Recruiter Screen",
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    chartColor: "#3b82f6",
  },
  "First Interview": {
    label: "First Interview",
    className:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
    chartColor: "#f97316",
  },
  "Second Interview": {
    label: "Second Interview",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    chartColor: "#f59e0b",
  },
  "Third Interview": {
    label: "Third Interview",
    className:
      "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
    chartColor: "#ea580c",
  },
  Offer: {
    label: "Offer",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    chartColor: "#10b981",
  },
};

export const OUTCOME_CONFIG: Record<Outcome, AccentClasses> = {
  "No Reply": {
    label: "No Reply",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
    chartColor: "#94a3b8",
  },
  Rejected: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    chartColor: "#f43f5e",
  },
  Withdrew: {
    label: "Withdrew",
    className:
      "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200",
    chartColor: "#64748b",
  },
  Accepted: {
    label: "Accepted",
    className:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300",
    chartColor: "#22c55e",
  },
  Declined: {
    label: "Declined",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    chartColor: "#d97706",
  },
};
