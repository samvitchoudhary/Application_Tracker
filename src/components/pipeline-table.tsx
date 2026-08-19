"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteApplication,
  editStageHistory,
  logStage,
  setOutcome,
} from "@/app/actions";
import {
  ApplicationForm,
  type ApplicationFormRecord,
} from "@/components/application-form";
import { StageProgress } from "@/components/stage-progress";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  furthestStage,
  hasReachedOffer,
  isOfferOnlyOutcome,
  nextStage,
  OUTCOME_CONFIG,
  OUTCOMES,
  STAGE_CONFIG,
  STAGES,
  type Outcome,
  type Stage,
  type StageEvent,
} from "@/lib/stages";
type PipelineTableProps = {
  applications: ApplicationFormRecord[];
  cycleId: string;
};

type SortKey = "date" | "stage";
type SortDir = "asc" | "desc";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAppliedDate(value: string) {
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

function StageHistoryEditor({
  events,
  onChange,
}: {
  events: StageEvent[];
  onChange: (events: StageEvent[]) => void;
}) {
  function updateRow(index: number, patch: Partial<StageEvent>) {
    onChange(
      events.map((event, eventIndex) =>
        eventIndex === index ? { ...event, ...patch } : event
      )
    );
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Stage history</p>
      <p className="text-xs text-muted-foreground">
        Dates are sorted on save. Consecutive identical stages are rejected.
      </p>
      <div className="grid gap-2">
        {events.map((event, index) => (
          <div key={`${event.stage}-${index}`} className="flex items-center gap-2">
            <Select
              value={event.stage}
              onValueChange={(value) => updateRow(index, { stage: value })}
            >
              <SelectTrigger className="min-w-0 flex-1" aria-label={`Stage ${index + 1}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_CONFIG[stage].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[10.5rem]"
              value={event.date.slice(0, 10)}
              onChange={(eventChange) =>
                updateRow(index, { date: eventChange.target.value })
              }
              aria-label={`Date for stage ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove stage ${index + 1}`}
              onClick={() =>
                onChange(events.filter((_, eventIndex) => eventIndex !== index))
              }
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => {
          const last = events[events.length - 1];
          const lastStage = STAGES.find((stage) => stage === last?.stage);
          const stage = lastStage ? (nextStage(lastStage) ?? lastStage) : "Applied";
          onChange([...events, { stage, date: todayIsoDate() }]);
        }}
      >
        Add stage
      </Button>
    </div>
  );
}

function LogStagePopover({
  application,
  onClose,
}: {
  application: ApplicationFormRecord;
  onClose: () => void;
}) {
  const router = useRouter();
  const defaultStage = nextStage(application.currentStage) ?? application.currentStage;
  const [stage, setStage] = useState<Stage>(defaultStage);
  const [date, setDate] = useState(todayIsoDate);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setError(null);
    setPending(true);
    const result = await logStage(application.id, stage, date);
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <PopoverContent align="end" className="w-72">
      <PopoverHeader>
        <PopoverTitle>Log stage</PopoverTitle>
        <PopoverDescription>
          Defaults to the next step after {application.currentStage}.
        </PopoverDescription>
      </PopoverHeader>
      <div className="grid gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`log-stage-${application.id}`}>Stage</Label>
          <Select value={stage} onValueChange={(value) => setStage(value as Stage)}>
            <SelectTrigger id={`log-stage-${application.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {STAGES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STAGE_CONFIG[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`log-date-${application.id}`}>Date</Label>
          <Input
            id={`log-date-${application.id}`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={onSubmit}>
            {pending ? "Saving..." : "Log stage"}
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
}

export function PipelineTable({ applications, cycleId }: PipelineTableProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationFormRecord | null>(null);
  const [historyDraft, setHistoryDraft] = useState<StageEvent[]>([]);
  const [deleting, setDeleting] = useState<ApplicationFormRecord | null>(null);
  const [logging, setLogging] = useState<ApplicationFormRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    const filtered = applications.filter((application) => {
      if (stageFilter !== "all" && application.currentStage !== stageFilter) {
        return false;
      }

      if (outcomeFilter !== "all") {
        return application.outcome === outcomeFilter;
      }

      return true;
    });

    const direction = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortKey === "stage") {
        const aIndex = STAGES.indexOf(furthestStage(a.stageEvents, a.currentStage));
        const bIndex = STAGES.indexOf(furthestStage(b.stageEvents, b.currentStage));
        return (aIndex - bIndex) * direction;
      }

      return a.dateApplied.localeCompare(b.dateApplied) * direction;
    });
  }, [applications, outcomeFilter, sortDir, sortKey, stageFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("desc");
  }

  function openEdit(application: ApplicationFormRecord) {
    setHistoryDraft(application.stageEvents ?? []);
    setEditing(application);
  }

  function handleFormDone() {
    setAddOpen(false);
    setEditing(null);
    router.refresh();
  }

  async function handleEditDone() {
    if (!editing) {
      handleFormDone();
      return;
    }

    const result = await editStageHistory(editing.id, historyDraft);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    handleFormDone();
  }

  async function handleDelete() {
    if (!deleting) {
      return;
    }

    setDeleteError(null);
    setDeletePending(true);
    const result = await deleteApplication(deleting.id);
    setDeletePending(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleting(null);
    router.refresh();
  }

  async function handleSetOutcome(
    application: ApplicationFormRecord,
    outcome: Outcome | null
  ) {
    const result = await setOutcome(application.id, outcome);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.refresh();
  }

  const addButton = (
    <Button type="button" onClick={() => setAddOpen(true)}>
      <PlusIcon data-icon="inline-start" />
      Add application
    </Button>
  );

  const sortIcon =
    sortDir === "asc" ? (
      <ArrowUpIcon className="size-3.5" />
    ) : (
      <ArrowDownIcon className="size-3.5" />
    );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48" aria-label="Filter by stage">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_CONFIG[stage].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-56" aria-label="Filter by outcome">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All outcomes</SelectItem>
            {OUTCOMES.map((outcome) => (
              <SelectItem key={outcome} value={outcome}>
                {OUTCOME_CONFIG[outcome].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">{addButton}</div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-sm font-medium">No applications yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first application to this cycle to start tracking the pipeline.
          </p>
          {addButton}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-sm font-medium">No applications match these filters</p>
          <p className="text-sm text-muted-foreground">
            Try another stage or outcome, or clear the filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 px-2"
                    onClick={() => toggleSort("date")}
                  >
                    Date applied
                    {sortKey === "date" ? sortIcon : null}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[16rem]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 px-2"
                    onClick={() => toggleSort("stage")}
                  >
                    Progress
                    {sortKey === "stage" ? sortIcon : null}
                  </Button>
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((application) => {
                const reachedOffer = hasReachedOffer(
                  application.stageEvents,
                  application.currentStage
                );

                return (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.company}
                    </TableCell>
                    <TableCell>{application.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.locations || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAppliedDate(application.dateApplied)}
                    </TableCell>
                    <TableCell>
                      <StageProgress
                        stageEvents={application.stageEvents}
                        outcome={application.outcome}
                      />
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={logging?.id === application.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setLogging(null);
                          }
                        }}
                      >
                        <PopoverAnchor asChild>
                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${application.company}`}
                                >
                                  <MoreHorizontalIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => setLogging(application)}
                                >
                                  Log next stage
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    Set outcome
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {OUTCOMES.map((outcome) => {
                                      const offerLocked =
                                        isOfferOnlyOutcome(outcome) && !reachedOffer;

                                      return (
                                        <DropdownMenuItem
                                          key={outcome}
                                          disabled={offerLocked}
                                          onSelect={() => {
                                            void handleSetOutcome(
                                              application,
                                              outcome
                                            );
                                          }}
                                        >
                                          {OUTCOME_CONFIG[outcome].label}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        void handleSetOutcome(application, null);
                                      }}
                                    >
                                      Clear outcome
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => openEdit(application)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => {
                                    setDeleteError(null);
                                    setDeleting(application);
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </PopoverAnchor>
                        {logging?.id === application.id ? (
                          <LogStagePopover
                            key={application.id}
                            application={application}
                            onClose={() => setLogging(null)}
                          />
                        ) : null}
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add application</DialogTitle>
            <DialogDescription>
              Save a new job application to this cycle.
            </DialogDescription>
          </DialogHeader>
          <ApplicationForm cycleId={cycleId} onDone={handleFormDone} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit application</DialogTitle>
            <DialogDescription>
              Update the details and stage history for this application.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <ApplicationForm
              key={editing.id}
              cycleId={cycleId}
              application={editing}
              onDone={handleEditDone}
            >
              <StageHistoryEditor events={historyDraft} onChange={setHistoryDraft} />
            </ApplicationForm>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `This will permanently remove ${deleting.company} — ${deleting.role} from this cycle.`
                : "This will permanently remove the application."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={handleDelete}
            >
              {deletePending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
