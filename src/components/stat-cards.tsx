import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationStats } from "@/lib/data";
import { STATUS_CONFIG, STATUSES } from "@/lib/status";
import { cn } from "@/lib/utils";

type StatCardsProps = {
  stats: ApplicationStats;
};

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Card size="sm" className="border border-border bg-muted/30">
        <CardHeader>
          <CardDescription>Total</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.total}
          </CardTitle>
        </CardHeader>
      </Card>

      {STATUSES.map((status) => {
        const config = STATUS_CONFIG[status];

        return (
          <Card
            key={status}
            size="sm"
            className={cn("border", config.className)}
          >
            <CardHeader>
              <CardDescription className="text-current/70">
                {config.label}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {stats.byStatus[status]}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
