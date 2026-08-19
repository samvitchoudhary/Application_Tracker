"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import type { DefaultLink, SankeyNodeDatum } from "@nivo/sankey";
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
  type SankeyNode,
} from "@/lib/sankey";

type SankeyChartProps = {
  applications: SankeyApplication[];
};

const LARGE_TERMINALS = new Set(["Rejected", "Ghosted"]);

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

function sortNodes(
  a: SankeyNodeDatum<SankeyNode, DefaultLink>,
  b: SankeyNodeDatum<SankeyNode, DefaultLink>
) {
  const aLarge = LARGE_TERMINALS.has(a.id) ? 1 : 0;
  const bLarge = LARGE_TERMINALS.has(b.id) ? 1 : 0;

  if (aLarge !== bLarge) {
    return aLarge - bLarge;
  }

  return b.value - a.value;
}

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
        <div className="h-[600px]">
          {data.links.length > 0 ? (
            <ResponsiveSankey<SankeyNode, DefaultLink>
              data={data}
              margin={{ top: 20, right: 152, bottom: 20, left: 104 }}
              align="justify"
              sort={sortNodes}
              colors={(node) => node.nodeColor}
              nodeOpacity={1}
              nodeHoverOpacity={1}
              nodeHoverOthersOpacity={1}
              nodeThickness={16}
              nodeSpacing={36}
              nodeBorderWidth={2}
              nodeBorderColor="#ffffff"
              nodeBorderRadius={4}
              linkOpacity={0.35}
              linkHoverOpacity={0.7}
              linkHoverOthersOpacity={0.08}
              linkBlendMode="normal"
              enableLinkGradient
              label={(node) => `${node.id} (${node.value})`}
              labelPosition="outside"
              labelPadding={12}
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
