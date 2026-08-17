"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { deleteApplication } from "@/app/actions";
import {
  ApplicationForm,
  type ApplicationFormRecord,
} from "@/components/application-form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/status";
import { cn } from "@/lib/utils";

type ApplicationsTableProps = {
  applications: ApplicationFormRecord[];
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

export function ApplicationsTable({
  applications,
  cycleId,
}: ApplicationsTableProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationFormRecord | null>(null);
  const [deleting, setDeleting] = useState<ApplicationFormRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  function handleFormDone() {
    setAddOpen(false);
    setEditing(null);
    router.refresh();
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

  const addButton = (
    <Button type="button" onClick={() => setAddOpen(true)}>
      <PlusIcon data-icon="inline-start" />
      Add application
    </Button>
  );

  return (
    <section className="space-y-4">
      {applications.length > 0 ? (
        <>
          <div className="flex justify-end">{addButton}</div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Date applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
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
                      <Badge
                        variant="outline"
                        className={cn(
                          STATUS_CONFIG[application.status].className
                        )}
                      >
                        {STATUS_CONFIG[application.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          PRIORITY_CONFIG[application.priority].className
                        )}
                      >
                        {PRIORITY_CONFIG[application.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.link ? (
                        <Button variant="ghost" size="icon-sm" asChild>
                          <a
                            href={externalHref(application.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${application.company} listing`}
                          >
                            <ExternalLinkIcon />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
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
                            onSelect={() => setEditing(application)}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-sm font-medium">No applications yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first application to this cycle to start tracking.
          </p>
          {addButton}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit application</DialogTitle>
            <DialogDescription>
              Update the details for this application.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <ApplicationForm
              key={editing.id}
              cycleId={cycleId}
              application={editing}
              onDone={handleFormDone}
            />
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
