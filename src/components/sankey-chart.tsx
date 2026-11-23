"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import type {
  DefaultLink,
  SankeyLinkDatum,
  SankeyNodeDatum,
} from "@nivo/sankey";
import { useRouter, useSearchParams } from "next/navigation";
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
import { isStage, stageToSlug } from "@/lib/stages";

type SankeyChartProps = {
  applications: SankeyApplication[];
};

const LARGE_TERMINALS = new Set(["Rejected", "Ghosted"]);

const THEME = {
  labels: {
    text: {
      fill: "#F4EEE6",
      fontSize: 11,
      fontWeight: 500,
    },
  },
  tooltip: {
    container: {
      background: "var(--popover)",
      color: "var(--popover-foreground)",
      fontSize: 12,
      borderRadius: 10,
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

function isStageNode(
  datum: SankeyNodeDatum<SankeyNode, DefaultLink> | SankeyLinkDatum<SankeyNode, DefaultLink>
): datum is SankeyNodeDatum<SankeyNode, DefaultLink> {
  return "id" in datum && typeof datum.id === "string";
}

export function SankeyChart({ applications }: SankeyChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = buildSankeyData(applications);
  const sparse = applications.length > 0 && !hasStageToStageFlow(data);

  function handleClick(
    datum: SankeyNodeDatum<SankeyNode, DefaultLink> | SankeyLinkDatum<SankeyNode, DefaultLink>
  ) {
    if (!isStageNode(datum) || !isStage(datum.id)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "pipeline");
    params.set("stage", stageToSlug(datum.id));
    router.push(`/?${params.toString()}`);
  }

  return (
    <Card className="rounded-2xl border-border bg-card ring-0">
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
        <div className="h-[600px] [&_rect]:cursor-pointer">
          {data.links.length > 0 ? (
            <ResponsiveSankey<SankeyNode, DefaultLink>
              data={data}
              isInteractive
              onClick={handleClick}
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
              nodeBorderColor="#38322C"
              nodeBorderRadius={4}
              linkOpacity={0.35}
              linkHoverOpacity={0.7}
              linkHoverOthersOpacity={0.08}
              linkBlendMode="normal"
              enableLinkGradient
              label={(node) => `${node.id} (${node.value})`}
              labelPosition="outside"
              labelPadding={12}
              labelTextColor="#F4EEE6"
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
