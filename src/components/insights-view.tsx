"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipValueType,
} from "recharts";
import type { ApplicationFormRecord } from "@/components/application-form";
import { SankeyChart } from "@/components/sankey-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PRIORITIES,
  PRIORITY_CONFIG,
} from "@/lib/status";
import {
  furthestStage,
  STAGE_CONFIG,
  STAGES,
  type Stage,
} from "@/lib/stages";

type InsightsViewProps = {
  applications: ApplicationFormRecord[];
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

function parseAppliedDate(value: string): Date | null {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfWeekMonday(date: Date): Date {
  const weekday = date.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysFromMonday);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeekLabel(isoDate: string): string {
  const date = parseAppliedDate(isoDate);
  if (!date) {
    return isoDate;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weeksBetween(start: Date, end: Date): string[] {
  const weeks: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    weeks.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function countFormatter(
  value: TooltipValueType | undefined
): [ReactNode, string] {
  return [value ?? 0, "Applications"];
}

export function InsightsView({ applications }: InsightsViewProps) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium">No data yet for this cycle</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add applications to see stage, pace, and priority insights.
        </p>
      </div>
    );
  }

  const total = applications.length;
  let appliedOnly = 0;
  let activeCount = 0;
  let offerCount = 0;
  const stageCounts = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<
    Stage,
    number
  >;
  const priorityCounts = {
    High: 0,
    Medium: 0,
    Low: 0,
  };
  const weekCounts = new Map<string, number>();
  let earliestWeek: Date | null = null;
  let latestWeek: Date | null = null;

  for (const application of applications) {
    stageCounts[application.currentStage] += 1;
    priorityCounts[application.priority] += 1;

    if (application.currentStage === "Applied" && application.outcome == null) {
      appliedOnly += 1;
    }
    if (application.outcome == null) {
      activeCount += 1;
    }
    if (furthestStage(application.stageEvents, application.currentStage) === "Offer") {
      offerCount += 1;
    }

    const appliedDate = parseAppliedDate(application.dateApplied);
    if (!appliedDate) {
      continue;
    }

    const weekStart = startOfWeekMonday(appliedDate);
    const key = toIsoDate(weekStart);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);

    if (!earliestWeek || weekStart < earliestWeek) {
      earliestWeek = weekStart;
    }
    if (!latestWeek || weekStart > latestWeek) {
      latestWeek = weekStart;
    }
  }

  const responseRate = Math.round(((total - appliedOnly) / total) * 100);

  const stageData = STAGES.map((stage) => ({
    name: STAGE_CONFIG[stage].label,
    value: stageCounts[stage],
    fill: STAGE_CONFIG[stage].chartColor,
  }));

  const weeklyData =
    earliestWeek && latestWeek
      ? weeksBetween(earliestWeek, latestWeek).map((week) => ({
          week,
          label: formatWeekLabel(week),
          count: weekCounts.get(week) ?? 0,
        }))
      : [];

  const priorityData = PRIORITIES.map((priority) => ({
    name: PRIORITY_CONFIG[priority].label,
    count: priorityCounts[priority],
    fill: PRIORITY_CONFIG[priority].chartColor,
  }));

  return (
    <div className="grid gap-4">
      <SankeyChart applications={applications} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total applications</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {activeCount}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              No outcome set
            </p>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Offers</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {offerCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Response rate</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {responseRate}%
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              (total − Applied with no outcome) / total
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stage breakdown</CardTitle>
            <CardDescription>Applications in this cycle by current stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {stageData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={countFormatter}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {stageData.map((entry) => (
                <li key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span>{entry.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry.value}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Applications over time</CardTitle>
            <CardDescription>Weekly pace by date applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    interval="equidistantPreserveStart"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={countFormatter}
                    labelFormatter={(label) => `Week of ${label}`}
                  />
                  <Bar
                    dataKey="count"
                    fill={STAGE_CONFIG.Applied.chartColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Priority breakdown</CardTitle>
            <CardDescription>Counts by High, Medium, and Low</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={countFormatter}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
