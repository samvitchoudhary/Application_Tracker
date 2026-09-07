"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  furthestStage,
  isOutcome,
  isStage,
  OUTCOME_CONFIG,
  STAGE_CONFIG,
  STAGES,
  type Outcome,
  type Stage,
  type StageEvent,
} from "@/lib/stages";
import { cn } from "@/lib/utils";

type StageProgressProps = {
  stageEvents: StageEvent[];
  outcome: Outcome | null;
  currentStage?: Stage;
};

function formatHistoryDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StageProgress({
  stageEvents,
  outcome,
  currentStage,
}: StageProgressProps) {
  const furthest = currentStage ?? furthestStage(stageEvents);
  const furthestIndex = STAGES.indexOf(furthest);
  const filledThrough = stageEvents.length > 0 ? furthestIndex : -1;
  const stageLabel = isStage(furthest)
    ? STAGE_CONFIG[furthest].label
    : furthest;

  return (
    <div className="flex min-w-[14rem] items-center gap-2.5">
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Progress: ${stageLabel}`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            {STAGES.map((stage, index) => {
              const filled = index <= filledThrough;

              return (
                <span
                  key={stage}
                  className={cn(
                    "h-2 min-w-0 flex-1 rounded-sm first:rounded-l-full last:rounded-r-full",
                    !filled && "bg-border"
                  )}
                  style={
                    filled
                      ? { backgroundColor: STAGE_CONFIG[stage].chartColor }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-xs items-start py-2 text-left"
        >
          {stageEvents.length > 0 ? (
            <ul className="grid gap-1">
              {stageEvents.map((event, index) => (
                <li key={`${event.stage}-${event.date}-${index}`}>
                  {isStage(event.stage)
                    ? STAGE_CONFIG[event.stage].label
                    : event.stage}
                  {" · "}
                  {formatHistoryDate(event.date)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No stage history yet</p>
          )}
        </TooltipContent>
      </Tooltip>

      {!outcome ? (
        <span className="shrink-0 font-heading text-xs font-medium text-muted-foreground">
          {stageLabel}
        </span>
      ) : isOutcome(outcome) ? (
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-full px-2.5",
            OUTCOME_CONFIG[outcome].className
          )}
        >
          {OUTCOME_CONFIG[outcome].label}
        </Badge>
      ) : null}
    </div>
  );
}
