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
import { PRIORITIES, PRIORITY_CONFIG } from "@/lib/status";
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
  borderRadius: "10px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

/** Muted warm tones — priority is not a stage/outcome accent. */
const PRIORITY_CHART_COLORS: Record<(typeof PRIORITIES)[number], string> = {
  High: "#A69E95",
  Medium: "#8A8279",
  Low: "#7C746B",
};

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium">No data yet for this cycle</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add applications to see stage flow, pace, and priority breakdowns.
        </p>
      </div>
    );
  }

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
    fill: PRIORITY_CHART_COLORS[priority],
  }));

  return (
    <div className="grid gap-5">
      <SankeyChart applications={applications} />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="rounded-2xl border-border bg-card ring-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Stage breakdown</CardTitle>
            <CardDescription>
              Applications in this cycle by current stage
            </CardDescription>
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
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="tabular-nums text-foreground">
                    {entry.value}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card ring-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Applications over time</CardTitle>
            <CardDescription>Weekly pace by date applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
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

        <Card className="rounded-2xl border-border bg-card ring-0 lg:col-span-5">
          <CardHeader>
            <CardTitle>Priority breakdown</CardTitle>
            <CardDescription>Counts by high, medium, and low</CardDescription>
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
