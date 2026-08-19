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
  type StageEvent,
} from "@/lib/stages";
import { cn } from "@/lib/utils";

type StageProgressProps = {
  stageEvents: StageEvent[];
  outcome: Outcome | null;
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

export function StageProgress({ stageEvents, outcome }: StageProgressProps) {
  const furthest = furthestStage(stageEvents);
  const furthestIndex = STAGES.indexOf(furthest);
  const filledThrough = stageEvents.length > 0 ? furthestIndex : -1;

  return (
    <div className="flex min-w-[12rem] items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="flex min-w-0 flex-1 items-center gap-0.5 rounded-md py-1"
          aria-label={`Progress through ${furthest}`}
        >
          {STAGES.map((stage, index) => {
            const filled = index <= filledThrough;

            return (
              <span
                key={stage}
                className={cn(
                  "h-1.5 min-w-0 flex-1 rounded-full",
                  !filled && "bg-muted"
                )}
                style={
                  filled
                    ? { backgroundColor: STAGE_CONFIG[stage].chartColor }
                    : undefined
                }
              />
            );
          })}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-xs items-start bg-popover py-2 text-left text-popover-foreground"
        >
          {stageEvents.length > 0 ? (
            <ul className="grid gap-1">
              {stageEvents.map((event, index) => (
                <li key={`${event.stage}-${event.date}-${index}`}>
                  {isStage(event.stage) ? STAGE_CONFIG[event.stage].label : event.stage}
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

      {outcome && isOutcome(outcome) ? (
        <Badge
          variant="outline"
          className={cn("shrink-0", OUTCOME_CONFIG[outcome].className)}
        >
          {OUTCOME_CONFIG[outcome].label}
        </Badge>
      ) : null}
    </div>
  );
}
