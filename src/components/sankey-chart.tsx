"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildSankeyData,
  hasStageToStageFlow,
  type SankeyApplication,
} from "@/lib/sankey";

type SankeyChartProps = {
  applications: SankeyApplication[];
};

const THEME = {
  labels: {
    text: {
      fill: "#334155",
      fontSize: 11,
      fontWeight: 500,
    },
  },
  tooltip: {
    container: {
      background: "var(--popover)",
      color: "var(--popover-foreground)",
      fontSize: 12,
      borderRadius: 8,
      boxShadow: "none",
      border: "1px solid var(--border)",
    },
  },
};

export function SankeyChart({ applications }: SankeyChartProps) {
  const data = buildSankeyData(applications);
  const sparse = applications.length > 0 && !hasStageToStageFlow(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application flow</CardTitle>
        <CardDescription>
          How applications move through stages to an outcome
        </CardDescription>
        {sparse ? (
          <p className="text-xs text-muted-foreground">
            Most applications are still at Applied, so the flow is limited until
            more stages are logged.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="h-[420px]">
          {data.links.length > 0 ? (
            <ResponsiveSankey
              data={data}
              margin={{ top: 12, right: 128, bottom: 12, left: 12 }}
              align="justify"
              sort="input"
              colors={(node) => node.nodeColor}
              nodeOpacity={1}
              nodeThickness={14}
              nodeSpacing={18}
              nodeBorderWidth={1}
              nodeBorderColor="#ffffff"
              nodeBorderRadius={3}
              linkOpacity={0.28}
              linkHoverOpacity={0.65}
              linkHoverOthersOpacity={0.08}
              linkBlendMode="normal"
              enableLinkGradient
              label={(node) => `${node.id} (${node.value})`}
              labelPosition="outside"
              labelPadding={8}
              labelTextColor="#334155"
              theme={THEME}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Log stages to see application flow.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
