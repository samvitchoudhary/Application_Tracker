"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ApplicationFormRecord } from "@/components/application-form";
import { InsightsView } from "@/components/insights-view";
import { PipelineTable } from "@/components/pipeline-table";
import { Button } from "@/components/ui/button";
import { parseAppView, type AppView } from "@/lib/views";
import { cn } from "@/lib/utils";

type BoardViewProps = {
  applications: ApplicationFormRecord[];
  cycleId: string;
};

export function BoardView({ applications, cycleId }: BoardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = parseAppView(searchParams.get("view"));

  function setView(next: AppView) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.replace(`/?${params.toString()}`);
  }

  return (
    <section className="space-y-5">
      <div
        className="inline-flex rounded-[10px] border border-border bg-background p-1"
        role="group"
        aria-label="View"
      >
        {(["pipeline", "insights"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "rounded-lg px-4",
              view === option
                ? "bg-secondary text-foreground shadow-none"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={view === option}
            onClick={() => setView(option)}
          >
            {option === "pipeline" ? "Pipeline" : "Insights"}
          </Button>
        ))}
      </div>

      {view === "insights" ? (
        <InsightsView applications={applications} />
      ) : (
        <PipelineTable applications={applications} cycleId={cycleId} />
      )}
    </section>
  );
}
