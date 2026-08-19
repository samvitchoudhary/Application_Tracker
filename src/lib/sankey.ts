import {
  isOutcome,
  isStage,
  OUTCOME_CONFIG,
  STAGE_CONFIG,
  STAGES,
  type Outcome,
  type Stage,
  type StageEvent,
} from "@/lib/stages";

export type SankeyApplication = {
  stageEvents: StageEvent[];
  currentStage: Stage;
  outcome: Outcome | null;
};

export type SankeyNode = {
  id: string;
  nodeColor: string;
};

export type SankeyLink = {
  source: string;
  target: string;
  value: number;
};

export type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};

function nodeColor(id: string): string {
  if (isStage(id)) {
    return STAGE_CONFIG[id].chartColor;
  }

  if (isOutcome(id)) {
    return OUTCOME_CONFIG[id].chartColor;
  }

  return STAGE_CONFIG.Applied.chartColor;
}

function reachedStages(application: SankeyApplication): Stage[] {
  const reached = new Set<Stage>();

  for (const event of application.stageEvents ?? []) {
    if (isStage(event.stage)) {
      reached.add(event.stage);
    }
  }

  if (reached.size === 0 && isStage(application.currentStage)) {
    reached.add(application.currentStage);
  }

  return STAGES.filter((stage) => reached.has(stage));
}

export function buildSankeyData(
  applications: readonly SankeyApplication[]
): SankeyData {
  const linkValues = new Map<string, SankeyLink>();

  function addLink(source: string, target: string) {
    if (!source || !target || source === target) {
      return;
    }

    const key = `${source}\0${target}`;
    const existing = linkValues.get(key);

    if (existing) {
      existing.value += 1;
      return;
    }

    linkValues.set(key, { source, target, value: 1 });
  }

  for (const application of applications) {
    const stages = reachedStages(application);

    for (let index = 0; index < stages.length - 1; index += 1) {
      addLink(stages[index], stages[index + 1]);
    }

    const furthest = stages[stages.length - 1];
    if (!furthest) {
      continue;
    }

    if (application.outcome && isOutcome(application.outcome)) {
      addLink(furthest, application.outcome);
    }
  }

  const links = [...linkValues.values()].filter((link) => link.value > 0);
  const usedIds = new Set<string>();

  for (const link of links) {
    usedIds.add(link.source);
    usedIds.add(link.target);
  }

  const nodes: SankeyNode[] = [];

  for (const stage of STAGES) {
    if (usedIds.has(stage)) {
      nodes.push({ id: stage, nodeColor: nodeColor(stage) });
    }
  }

  // Small terminals first, Ghosted/Rejected last so sort:"input" clusters
  // the large bands at the bottom of the outcome column.
  const outcomeOrder = ["Accepted", "Ghosted", "Rejected"] as const;

  for (const outcome of outcomeOrder) {
    if (usedIds.has(outcome)) {
      nodes.push({ id: outcome, nodeColor: nodeColor(outcome) });
    }
  }

  return { nodes, links };
}

export function hasStageToStageFlow(data: SankeyData): boolean {
  return data.links.some(
    (link) => isStage(link.source) && isStage(link.target)
  );
}
