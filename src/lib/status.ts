export const STATUSES = [
  "Applied",
  "OA/Assessment",
  "Interviewing",
  "Offer",
  "Rejected",
] as const;

export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["High", "Medium", "Low"] as const;

export type Priority = (typeof PRIORITIES)[number];

export type AccentClasses = {
  label: string;
  className: string;
};

export const STATUS_CONFIG: Record<Status, AccentClasses> = {
  Applied: {
    label: "Applied",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  },
  "OA/Assessment": {
    label: "OA/Assessment",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  Interviewing: {
    label: "Interviewing",
    className:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  },
  Offer: {
    label: "Offer",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  Rejected: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

export const PRIORITY_CONFIG: Record<Priority, AccentClasses> = {
  High: {
    label: "High",
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  },
  Medium: {
    label: "Medium",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  Low: {
    label: "Low",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  },
};
