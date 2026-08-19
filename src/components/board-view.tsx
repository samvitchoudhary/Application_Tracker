"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ApplicationFormRecord } from "@/components/application-form";
import { InsightsView } from "@/components/insights-view";
import { PipelineTable } from "@/components/pipeline-table";
import { Button } from "@/components/ui/button";
import { parseAppView, type AppView } from "@/lib/views";

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
    <section className="space-y-4">
      <div
        className="inline-flex rounded-lg border p-0.5"
        role="group"
        aria-label="View"
      >
        <Button
          type="button"
          size="sm"
          variant={view === "pipeline" ? "secondary" : "ghost"}
          aria-pressed={view === "pipeline"}
          onClick={() => setView("pipeline")}
        >
          Pipeline
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "insights" ? "secondary" : "ghost"}
          aria-pressed={view === "insights"}
          onClick={() => setView("insights")}
        >
          Insights
        </Button>
      </div>

      {view === "insights" ? (
        <InsightsView applications={applications} />
      ) : (
        <PipelineTable applications={applications} cycleId={cycleId} />
      )}
    </section>
  );
}
