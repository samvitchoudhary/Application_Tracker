"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { updateApplication } from "@/app/actions";
import {
  ApplicationCard,
  ApplicationCardContent,
} from "@/components/application-card";
import {
  ApplicationForm,
  type ApplicationFormRecord,
} from "@/components/application-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUSES, STATUS_CONFIG, type Status } from "@/lib/status";
import { cn } from "@/lib/utils";

type KanbanBoardProps = {
  applications: ApplicationFormRecord[];
  cycleId: string;
};

function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

function KanbanColumn({
  status,
  applications,
  cycleId,
  onAdd,
}: {
  status: Status;
  applications: ApplicationFormRecord[];
  cycleId: string;
  onAdd: (status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <section className="flex w-64 shrink-0 flex-col rounded-xl border bg-muted/30">
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium",
            config.className
          )}
        >
          {config.label}
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {applications.length}
        </span>
      </header>

      <SortableContext
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2",
            "max-h-[calc(100vh-16rem)]",
            isOver && "bg-muted/60"
          )}
        >
          {applications.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              No applications
            </p>
          ) : (
            applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                cycleId={cycleId}
              />
            ))
          )}
        </div>
      </SortableContext>

      <div className="p-2 pt-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAdd(status)}
        >
          <PlusIcon data-icon="inline-start" />
          Add
        </Button>
      </div>
    </section>
  );
}

export function KanbanBoard({ applications, cycleId }: KanbanBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState(applications);
  const [syncedApplications, setSyncedApplications] = useState(applications);
  const [addStatus, setAddStatus] = useState<Status | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (applications !== syncedApplications) {
    setSyncedApplications(applications);
    setItems(applications);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const byStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      STATUSES.map((status) => [status, [] as ApplicationFormRecord[]])
    ) as Record<Status, ApplicationFormRecord[]>;

    for (const application of items) {
      grouped[application.status].push(application);
    }

    return grouped;
  }, [items]);

  const activeApplication = activeId
    ? items.find((application) => application.id === activeId)
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const activeApplicationId = String(active.id);
    const current = items.find(
      (application) => application.id === activeApplicationId
    );
    if (!current) {
      return;
    }

    const overId = String(over.id);
    let nextStatus: Status | undefined;
    if (isStatus(overId)) {
      nextStatus = overId;
    } else {
      nextStatus = items.find((application) => application.id === overId)
        ?.status;
    }

    if (!nextStatus || nextStatus === current.status) {
      return;
    }

    const previous = items;
    setItems((currentItems) =>
      currentItems.map((application) =>
        application.id === activeApplicationId
          ? { ...application, status: nextStatus }
          : application
      )
    );

    const result = await updateApplication(activeApplicationId, {
      status: nextStatus,
    });

    if (!result.success) {
      setItems(previous);
      toast.error(result.error);
      return;
    }

    router.refresh();
  }

  function handleFormDone() {
    setAddStatus(null);
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-1">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={byStatus[status]}
              cycleId={cycleId}
              onAdd={setAddStatus}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApplication ? (
            <div className="flex w-60 cursor-grabbing gap-2 rounded-lg border bg-card p-3 shadow-lg">
              <ApplicationCardContent application={activeApplication} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={Boolean(addStatus)}
        onOpenChange={(open) => {
          if (!open) {
            setAddStatus(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add application</DialogTitle>
            <DialogDescription>
              Save a new job application to this cycle
              {addStatus ? ` as ${STATUS_CONFIG[addStatus].label}` : ""}.
            </DialogDescription>
          </DialogHeader>
          {addStatus ? (
            <ApplicationForm
              key={addStatus}
              cycleId={cycleId}
              defaultStatus={addStatus}
              onDone={handleFormDone}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
