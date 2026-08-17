"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ApplicationsTable } from "@/components/applications-table";
import { KanbanBoard } from "@/components/kanban-board";
import { Button } from "@/components/ui/button";
import type { ApplicationFormRecord } from "@/components/application-form";

type BoardViewProps = {
  applications: ApplicationFormRecord[];
  cycleId: string;
};

export function BoardView({ applications, cycleId }: BoardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "board" ? "board" : "table";

  function setView(next: "table" | "board") {
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
          variant={view === "table" ? "secondary" : "ghost"}
          aria-pressed={view === "table"}
          onClick={() => setView("table")}
        >
          Table
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "board" ? "secondary" : "ghost"}
          aria-pressed={view === "board"}
          onClick={() => setView("board")}
        >
          Board
        </Button>
      </div>

      {view === "board" ? (
        <KanbanBoard applications={applications} cycleId={cycleId} />
      ) : (
        <ApplicationsTable applications={applications} cycleId={cycleId} />
      )}
    </section>
  );
}
