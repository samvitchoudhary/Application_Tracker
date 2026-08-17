"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCycle } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function suggestedCycleName() {
  return `${new Date().getFullYear()} Recruiting Cycle`;
}

type NewCycleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view?: "table" | "board";
};

export function NewCycleDialog({
  open,
  onOpenChange,
  view,
}: NewCycleDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(suggestedCycleName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(suggestedCycleName());
      setError(null);
      setPending(false);
    }
    onOpenChange(next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await createCycle(name);

    if (!result.success) {
      setPending(false);
      setError(result.error);
      return;
    }

    const params = new URLSearchParams();
    params.set("cycle", result.data.id);
    if (view) {
      params.set("view", view);
    }
    onOpenChange(false);
    router.push(`/?${params.toString()}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New cycle</DialogTitle>
          <DialogDescription>
            Create a recruiting cycle to group applications.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cycle-name">Cycle name</Label>
            <Input
              id="cycle-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="2027 Recruiting Cycle"
              autoComplete="off"
              disabled={pending}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmptyCyclesPrompt({ view }: { view?: "table" | "board" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium">
        Create your first cycle to get started
      </p>
      <Button type="button" onClick={() => setOpen(true)}>
        Create cycle
      </Button>
      <NewCycleDialog open={open} onOpenChange={setOpen} view={view} />
    </div>
  );
}
