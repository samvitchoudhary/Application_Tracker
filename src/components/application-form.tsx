"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  createApplication,
  updateApplication,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, PRIORITY_CONFIG, type Priority } from "@/lib/status";
import type { Outcome, Stage, StageEvent } from "@/lib/stages";

export type ApplicationFormRecord = {
  id: string;
  company: string;
  role: string;
  locations: string | null;
  link: string | null;
  dateApplied: string;
  currentStage: Stage;
  outcome: Outcome | null;
  stageEvents: StageEvent[];
  priority: Priority;
  notes: string | null;
};

type ApplicationFormProps = {
  cycleId: string;
  application?: ApplicationFormRecord;
  onDone: () => void | Promise<void>;
  children?: ReactNode;
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export function ApplicationForm({
  cycleId,
  application,
  onDone,
  children,
}: ApplicationFormProps) {
  const isEdit = Boolean(application);
  const [company, setCompany] = useState(application?.company ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [locations, setLocations] = useState(application?.locations ?? "");
  const [link, setLink] = useState(application?.link ?? "");
  const [dateApplied, setDateApplied] = useState(
    application?.dateApplied
      ? toDateInputValue(application.dateApplied)
      : todayIsoDate()
  );
  const [priority, setPriority] = useState<Priority>(
    application?.priority ?? "Medium"
  );
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload = {
      cycleId,
      company,
      role,
      locations: locations.trim() ? locations : null,
      link: link.trim() ? link : null,
      dateApplied,
      priority,
      notes: notes.trim() ? notes : null,
    };

    const result = application
      ? await updateApplication(application.id, payload)
      : await createApplication(payload);

    if (!result.success) {
      setPending(false);
      setError(result.error);
      return;
    }

    try {
      await onDone();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            required
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            autoComplete="organization"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            required
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="locations">Locations</Label>
          <Input
            id="locations"
            name="locations"
            value={locations}
            onChange={(event) => setLocations(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="link">Link</Label>
          <Input
            id="link"
            name="link"
            type="text"
            inputMode="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dateApplied">Date applied</Label>
          <Input
            id="dateApplied"
            name="dateApplied"
            type="date"
            required
            value={dateApplied}
            onChange={(event) => setDateApplied(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as Priority)}
          >
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {PRIORITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PRIORITY_CONFIG[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
        />
      </div>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Add application"}
        </Button>
      </div>
    </form>
  );
}
