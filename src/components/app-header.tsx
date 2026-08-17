"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewCycleDialog } from "@/components/new-cycle-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEW_CYCLE_VALUE = "__new_cycle__";

type CycleOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type AppHeaderProps = {
  cycles: CycleOption[];
  selectedCycleId: string | null;
  view?: "table" | "board" | "insights";
};

export function AppHeader({
  cycles,
  selectedCycleId,
  view,
}: AppHeaderProps) {
  const router = useRouter();
  const [newCycleOpen, setNewCycleOpen] = useState(false);

  function onCycleChange(value: string) {
    if (value === NEW_CYCLE_VALUE) {
      setNewCycleOpen(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("cycle", value);
    if (view) {
      params.set("view", view);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
        <p className="text-sm font-semibold tracking-tight">Job Tracker</p>

        {cycles.length > 0 && selectedCycleId ? (
          <Select value={selectedCycleId} onValueChange={onCycleChange}>
            <SelectTrigger className="min-w-52 max-w-xs" aria-label="Select cycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{cycle.name}</span>
                    {cycle.isActive ? (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                        Active
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={NEW_CYCLE_VALUE}>+ New cycle</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">No cycles</p>
        )}

        <div className="ml-auto">
          <SignOutButton />
        </div>
      </div>

      <NewCycleDialog
        open={newCycleOpen}
        onOpenChange={setNewCycleOpen}
        view={view}
      />
    </header>
  );
}
