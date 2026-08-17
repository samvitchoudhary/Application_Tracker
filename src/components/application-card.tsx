"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLinkIcon } from "lucide-react";
import {
  ApplicationForm,
  type ApplicationFormRecord,
} from "@/components/application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRIORITY_CONFIG } from "@/lib/status";
import { cn } from "@/lib/utils";

type ApplicationCardProps = {
  application: ApplicationFormRecord;
  cycleId: string;
};

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

function externalHref(link: string) {
  if (/^https?:\/\//i.test(link)) {
    return link;
  }

  return `https://${link}`;
}

export function ApplicationCardContent({
  application,
}: {
  application: ApplicationFormRecord;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <p className="truncate font-semibold leading-tight">
        {application.company}
      </p>
      <p className="truncate text-sm text-muted-foreground">
        {application.role}
      </p>
      <Badge
        variant="outline"
        className={cn(PRIORITY_CONFIG[application.priority].className)}
      >
        {PRIORITY_CONFIG[application.priority].label}
      </Badge>
      {application.locations ? (
        <p className="truncate text-xs text-muted-foreground">
          {application.locations}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {formatAppliedDate(application.dateApplied)}
      </p>
    </div>
  );
}

export function ApplicationCard({ application, cycleId }: ApplicationCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const didDrag = useRef(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  useEffect(() => {
    if (isDragging) {
      didDrag.current = true;
    }
  }, [isDragging]);

  function handleFormDone() {
    setEditOpen(false);
    router.refresh();
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={cn(
          "flex cursor-grab gap-2 rounded-lg border bg-card p-3 text-left shadow-sm touch-none",
          "hover:shadow-md",
          isDragging && "z-10 cursor-grabbing opacity-50 shadow-lg"
        )}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (didDrag.current) {
            didDrag.current = false;
            return;
          }
          setEditOpen(true);
        }}
      >
        <ApplicationCardContent application={application} />
        {application.link ? (
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="shrink-0 self-start"
          >
            <a
              href={externalHref(application.link)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${application.company} listing`}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ExternalLinkIcon />
            </a>
          </Button>
        ) : null}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit application</DialogTitle>
            <DialogDescription>
              Update the details for this application.
            </DialogDescription>
          </DialogHeader>
          <ApplicationForm
            key={application.id}
            cycleId={cycleId}
            application={application}
            onDone={handleFormDone}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
