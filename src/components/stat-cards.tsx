"use client";

import { useEffect, useState } from "react";
import type { ApplicationStats } from "@/lib/data";
import { OUTCOME_CONFIG, STAGE_CONFIG } from "@/lib/stages";

type StatCardsProps = {
  stats: ApplicationStats;
};

const STRIP_STATS = [
  {
    key: "active" as const,
    label: "Active",
    color: STAGE_CONFIG["Recruiter Screen"].chartColor,
  },
  {
    key: "reachedInterview" as const,
    label: "Interviewing",
    color: STAGE_CONFIG["First Interview"].chartColor,
  },
  {
    key: "offers" as const,
    label: "Offers",
    color: STAGE_CONFIG.Offer.chartColor,
  },
  {
    key: "accepted" as const,
    label: "Accepted",
    color: OUTCOME_CONFIG.Accepted.chartColor,
  },
  {
    key: "rejected" as const,
    label: "Rejected",
    color: OUTCOME_CONFIG.Rejected.chartColor,
  },
];

function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value === 0) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    const duration = 600;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return display;
}

export function StatCards({ stats }: StatCardsProps) {
  const responseRate =
    stats.total > 0
      ? Math.round(((stats.total - stats.active) / stats.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p
          className="font-heading text-6xl font-bold tracking-tight text-foreground tabular-nums sm:text-7xl"
          aria-label={`${stats.total} applications this cycle`}
        >
          <CountUpNumber value={stats.total} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          applications this cycle
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-y-4">
        {STRIP_STATS.map((item, index) => (
          <div key={item.key} className="flex items-end">
            {index > 0 ? (
              <div
                className="mx-4 hidden h-10 w-px shrink-0 bg-border sm:block"
                aria-hidden
              />
            ) : null}
            <div className={index > 0 ? "sm:px-0" : ""}>
              <p className="font-heading text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <p
                className="font-heading text-2xl font-bold tabular-nums"
                style={{ color: item.color }}
              >
                {stats[item.key]}
              </p>
            </div>
          </div>
        ))}
        <div className="mx-4 hidden h-10 w-px shrink-0 bg-border sm:block" aria-hidden />
        <div>
          <p className="font-heading text-xs font-medium text-muted-foreground">
            Response rate
          </p>
          <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
            {responseRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
