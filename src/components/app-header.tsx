"use client";

import { useRouter } from "next/navigation";
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
};

type AppHeaderProps = {
  cycles: CycleOption[];
  selectedCycleId: string | null;
};

export function AppHeader({ cycles, selectedCycleId }: AppHeaderProps) {
  const router = useRouter();

  function onCycleChange(value: string) {
    if (value === NEW_CYCLE_VALUE) {
      return;
    }

    router.push(`/?cycle=${value}`);
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
                  {cycle.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem disabled value={NEW_CYCLE_VALUE}>
                + New cycle
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">No cycles</p>
        )}

        <div className="ml-auto">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
