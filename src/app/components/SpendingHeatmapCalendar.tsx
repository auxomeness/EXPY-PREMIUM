import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CurrencySettings, Expense, UserPlan } from "../App";
import { buildMonthlyHeatmap } from "../utils/heatmap";
import { formatUserCurrency } from "../utils/currency";
import { toDateKey } from "../utils/finance";
import { LockedFeatureCard } from "./LockedFeatureCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Skeleton } from "./ui/skeleton";

type SpendingHeatmapCalendarProps = {
  expenses: Expense[];
  currencySettings: CurrencySettings;
  plan: UserPlan;
  onOpenPremium?: () => void;
};

const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getHeatmapClass(intensity: number) {
  switch (intensity) {
    case 4:
      return "bg-primary text-primary-foreground";
    case 3:
      return "bg-primary/82 text-primary-foreground";
    case 2:
      return "bg-primary/50 text-primary-foreground";
    case 1:
      return "bg-primary/18 text-foreground";
    default:
      return "bg-muted/20 text-foreground";
  }
}

export function SpendingHeatmapCalendar({
  expenses,
  currencySettings,
  plan,
  onOpenPremium,
}: SpendingHeatmapCalendarProps) {
  const [activeMonth, setActiveMonth] = useState(() => new Date());
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timeoutId = window.setTimeout(() => setIsLoading(false), 120);
    return () => window.clearTimeout(timeoutId);
  }, [activeMonth, expenses.length]);

  const heatmap = useMemo(() => buildMonthlyHeatmap(expenses, activeMonth), [activeMonth, expenses]);
  const monthLabel = activeMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const activeDay = heatmap.days.find((day) => day.dateKey === activeDateKey) ?? null;
  const dayExpenses = useMemo(
    () => expenses.filter((expense) => toDateKey(expense.date) === activeDateKey),
    [activeDateKey, expenses],
  );
  const categoryBreakdown = useMemo(() => {
    return dayExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
  }, [dayExpenses]);

  const previewGrid = (
    <div className="rounded-[24px] border border-border/60 bg-background/75 p-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }).map((_, index) => (
          <div
            key={`preview-${index}`}
            className={`aspect-square rounded-2xl ${index % 5 === 0 ? "bg-primary/18" : index % 3 === 0 ? "bg-primary/10" : "bg-muted/18"}`}
          />
        ))}
      </div>
    </div>
  );

  if (plan !== "pro") {
    return (
      <LockedFeatureCard
        title="Spending Heatmap Calendar"
        description="See high-spend days and monthly spending patterns at a glance with the ExPro heatmap calendar."
        planLabel="ExPro"
        preview={previewGrid}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Spending Heatmap</CardTitle>
              <p className="app-list-meta">Daily spending intensity for the current month.</p>
            </div>
            <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/25 p-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-semibold tracking-[-0.02em]">{monthLabel}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div key={intensity} className="rounded-2xl border border-border/60 bg-muted/16 px-2 py-2 text-center">
                <div className={`mx-auto mb-2 h-3.5 w-8 rounded-full ${getHeatmapClass(intensity)}`} />
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {intensity === 0 ? "None" : intensity === 4 ? "Peak" : `L${intensity}`}
                </p>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2 px-1">
            {weekLabels.map((label) => (
              <p key={label} className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={`heatmap-skeleton-${index}`} className="aspect-square rounded-[20px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {heatmap.days.map((day) => {
                const dayDate = new Date(day.dateKey);
                const isCurrentMonth = dayDate.getMonth() === activeMonth.getMonth();

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setActiveDateKey(day.dateKey)}
                    className={`aspect-square rounded-[20px] border px-1.5 py-2 text-left transition-colors hover:border-primary/18 ${getHeatmapClass(day.intensity)} ${isCurrentMonth ? "border-border/40" : "border-transparent opacity-45"}`}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <span className="text-xs font-semibold">{dayDate.getDate()}</span>
                      {day.totalSpent > 0 ? (
                        <span className="text-[10px] font-medium opacity-80">{day.transactionCount} txns</span>
                      ) : (
                        <span className="text-[10px] opacity-55">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!expenses.length ? (
            <div className="app-empty-state text-sm text-muted-foreground">No spending data yet</div>
          ) : null}
        </CardContent>
      </Card>

      <Drawer open={Boolean(activeDay)} onOpenChange={(open) => !open && setActiveDateKey(null)}>
        <DrawerContent>
          {activeDay ? (
            <>
              <DrawerHeader>
                <DrawerTitle>{new Date(activeDay.dateKey).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</DrawerTitle>
                <DrawerDescription>Review the spending intensity and transaction mix for this day.</DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-5 pb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="muted-tile">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Spent</p>
                    <p className="mt-2 text-lg font-semibold">{formatUserCurrency(activeDay.totalSpent, currencySettings)}</p>
                  </div>
                  <div className="muted-tile">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Transactions</p>
                    <p className="mt-2 text-lg font-semibold">{activeDay.transactionCount}</p>
                  </div>
                </div>

                {Object.keys(categoryBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Category Breakdown</p>
                    <div className="space-y-2">
                      {Object.entries(categoryBreakdown).map(([category, amount]) => (
                        <div key={category} className="app-list-row flex items-center justify-between gap-3">
                          <div>
                            <p className="app-list-title capitalize">{category}</p>
                            <p className="app-list-meta">{dayExpenses.filter((expense) => expense.category === category).length} transaction(s)</p>
                          </div>
                          <span className="text-sm font-semibold">{formatUserCurrency(amount, currencySettings)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="app-empty-state text-sm text-muted-foreground">No spending recorded for this day.</div>
                )}
              </div>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
