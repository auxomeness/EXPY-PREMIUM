import { useEffect, useMemo, useState } from "react";
import { CalendarPlus2, Pencil, Repeat, Trash2 } from "lucide-react";
import type { ComputationExemption } from "../App";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { generateEntityId } from "../utils/userData";
import { toDateInputValue } from "../utils/finance";

type ExemptionManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exemptions: ComputationExemption[];
  onChange: (nextExemptions: ComputationExemption[]) => void;
  onExcludeToday: () => void;
  todayExcluded: boolean;
};

const REPEAT_OPTIONS: Array<{ value: ComputationExemption["repeat"]; label: string }> = [
  { value: "none", label: "One day only" },
  { value: "weekly", label: "Repeat weekly" },
  { value: "monthly", label: "Repeat monthly" },
  { value: "yearly", label: "Repeat yearly" },
];

const DEFAULT_FORM_STATE = {
  name: "",
  date: "",
  repeat: "none" as ComputationExemption["repeat"],
};

export function ExemptionManagerDialog({
  open,
  onOpenChange,
  exemptions,
  onChange,
  onExcludeToday,
  todayExcluded,
}: ExemptionManagerDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setFormState(DEFAULT_FORM_STATE);
    }
  }, [open]);

  const sortedExemptions = useMemo(
    () =>
      [...exemptions].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    [exemptions],
  );

  const resetForm = () => {
    setEditingId(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const now = new Date().toISOString();
    const nextExemption: ComputationExemption = {
      id: editingId || generateEntityId("exemption"),
      name: formState.name.trim() || "Exempted Day",
      date: new Date(formState.date).toISOString(),
      repeat: formState.repeat,
      createdAt: editingId
        ? exemptions.find((exemption) => exemption.id === editingId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    const nextExemptions = editingId
      ? exemptions.map((exemption) => (exemption.id === editingId ? nextExemption : exemption))
      : [...exemptions, nextExemption];

    onChange(nextExemptions);
    resetForm();
  };

  const handleEdit = (exemption: ComputationExemption) => {
    setEditingId(exemption.id);
    setFormState({
      name: exemption.name,
      date: toDateInputValue(exemption.date),
      repeat: exemption.repeat,
    });
  };

  const handleDelete = (exemptionId: string) => {
    onChange(exemptions.filter((exemption) => exemption.id !== exemptionId));
    if (editingId === exemptionId) {
      resetForm();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage Exempted Days</DrawerTitle>
          <DrawerDescription>
            Exempted days are ignored in budgets, averages, and balance insights.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-5 pb-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Quick protection for today</p>
                <p className="text-sm text-muted-foreground">
                  Keep unusual spending today from affecting automatic calculations and habit summaries.
                </p>
              </div>
              <Button variant={todayExcluded ? "secondary" : "outline"} onClick={onExcludeToday} disabled={todayExcluded}>
                {todayExcluded ? "Today Excluded" : "Exclude Today"}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-border/70 bg-card/70 p-4">
            <div className="flex items-center gap-2">
              <CalendarPlus2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">{editingId ? "Edit exemption" : "Add exemption"}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exemption-name">Label</Label>
              <Input
                id="exemption-name"
                placeholder="Exam week, payday, travel day..."
                value={formState.name}
                onChange={(event) => setFormState((currentState) => ({ ...currentState, name: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exemption-date">Date</Label>
                <Input
                  id="exemption-date"
                  type="date"
                  value={formState.date}
                  onChange={(event) => setFormState((currentState) => ({ ...currentState, date: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exemption-repeat">Repeat</Label>
                <Select
                  value={formState.repeat}
                  onValueChange={(value) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      repeat: value as ComputationExemption["repeat"],
                    }))
                  }
                >
                  <SelectTrigger id="exemption-repeat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              {editingId && (
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" className="flex-1">
                {editingId ? "Update Exemption" : "Add Exemption"}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Current exemptions</h3>
              <span className="text-xs text-muted-foreground">{sortedExemptions.length} total</span>
            </div>

            {sortedExemptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No exempted days yet. Add one-time or repeating exclusions for irregular spending days.
              </div>
            ) : (
              <div className="space-y-2">
                {sortedExemptions.map((exemption) => (
                  <div
                    key={exemption.id}
                    className="flex items-start justify-between gap-3 rounded-[22px] border border-border/70 bg-card/70 p-4"
                  >
                    <div>
                      <p className="font-medium">{exemption.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(exemption.date).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                          <Repeat className="h-3 w-3" />
                          {REPEAT_OPTIONS.find((option) => option.value === exemption.repeat)?.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(exemption)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(exemption.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="pt-0">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
