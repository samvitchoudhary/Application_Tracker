import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { BoardView } from "@/components/board-view";
import { EmptyCyclesPrompt } from "@/components/new-cycle-dialog";
import { StatCards } from "@/components/stat-cards";
import {
  getActiveCycle,
  getApplicationStats,
  getApplications,
  getCycles,
} from "@/lib/data";
import { parseAppView } from "@/lib/views";

export const dynamic = "force-dynamic";

function parseView(value: string | string[] | undefined) {
  const view = Array.isArray(value) ? value[0] : value;
  if (!view) {
    return undefined;
  }
  return parseAppView(view);
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const cycleParam = Array.isArray(params.cycle)
    ? params.cycle[0]
    : params.cycle;
  const view = parseView(params.view);

  const [cycles, activeCycle] = await Promise.all([
    getCycles(),
    getActiveCycle(),
  ]);

  const selectedCycle =
    (cycleParam ? cycles.find((cycle) => cycle.id === cycleParam) : undefined) ??
    activeCycle;

  if (!selectedCycle) {
    return (
      <div className="min-h-full">
        <AppHeader cycles={cycles} selectedCycleId={null} view={view} />
        <EmptyCyclesPrompt view={view} />
      </div>
    );
  }

  const [applications, stats] = await Promise.all([
    getApplications(selectedCycle.id),
    getApplicationStats(selectedCycle.id),
  ]);

  return (
    <div className="min-h-full">
      <AppHeader
        cycles={cycles}
        selectedCycleId={selectedCycle.id}
        view={view}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <StatCards stats={stats} />
        <Suspense fallback={null}>
          <BoardView
            applications={applications}
            cycleId={selectedCycle.id}
          />
        </Suspense>
      </div>
    </div>
  );
}
