import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationStats } from "@/lib/data";
import { OUTCOME_CONFIG, STAGE_CONFIG } from "@/lib/stages";
import { cn } from "@/lib/utils";

type StatCardsProps = {
  stats: ApplicationStats;
};

const TILES = [
  {
    key: "total",
    label: "Total",
    className: STAGE_CONFIG.Applied.className,
  },
  {
    key: "active",
    label: "Active",
    className: STAGE_CONFIG["Recruiter Screen"].className,
  },
  {
    key: "reachedInterview",
    label: "Interviewing",
    className: STAGE_CONFIG["First Interview"].className,
  },
  {
    key: "offers",
    label: "Offers",
    className: STAGE_CONFIG.Offer.className,
  },
  {
    key: "accepted",
    label: "Accepted",
    className: OUTCOME_CONFIG.Accepted.className,
  },
  {
    key: "rejected",
    label: "Rejected",
    className: OUTCOME_CONFIG.Rejected.className,
  },
] as const;

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {TILES.map((tile) => (
        <Card key={tile.key} size="sm" className={cn("border", tile.className)}>
          <CardHeader>
            <CardDescription className="text-current/70">
              {tile.label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stats[tile.key]}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
