import { AppHeader } from "@/components/app-header";
import { StatCards } from "@/components/stat-cards";
import {
  getActiveCycle,
  getApplicationStats,
  getApplications,
  getCycles,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const cycleParam = Array.isArray(params.cycle)
    ? params.cycle[0]
    : params.cycle;

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
        <AppHeader cycles={cycles} selectedCycleId={null} />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-sm text-muted-foreground">
            No recruiting cycles yet.
          </p>
        </div>
      </div>
    );
  }

  const [applications, stats] = await Promise.all([
    getApplications(selectedCycle.id),
    getApplicationStats(selectedCycle.id),
  ]);

  return (
    <div className="min-h-full">
      <AppHeader cycles={cycles} selectedCycleId={selectedCycle.id} />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <StatCards stats={stats} />
        <ul className="space-y-1 text-sm">
          {applications.map((application) => (
            <li key={application.id}>
              {application.company} — {application.role} — {application.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
