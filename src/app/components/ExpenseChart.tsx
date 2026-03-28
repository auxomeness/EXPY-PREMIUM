import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CurrencySettings, Expense } from "../App";
import { formatUserCurrency } from "../utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type ExpenseChartProps = {
  expenses: Expense[];
  currencySettings: CurrencySettings;
};

const DEFAULT_COLORS: Record<string, string> = {
  leisure: "#8b5cf6",
  bills: "#ef4444",
  transportation: "#3b82f6",
  food: "#22c55e",
  other: "#6b7280",
};

const generateColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

export const ExpenseChart = memo(function ExpenseChart({ expenses, currencySettings }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<Expense["category"], number>);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: amount,
      color: DEFAULT_COLORS[category] || generateColor(category),
    }));
  }, [expenses]);

  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                formatter={(value: number) => formatUserCurrency(value as number, currencySettings)}
                contentStyle={{
                  borderRadius: 14,
                  borderColor: "rgba(113,113,130,0.16)",
                  boxShadow: "0 18px 36px -24px rgba(15, 23, 42, 0.45)",
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={68}
                paddingAngle={chartData.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
            <p className="mt-1 text-base font-semibold tracking-[-0.02em]">
              {formatUserCurrency(total, currencySettings)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;

            return (
              <div key={`category-${index}-${item.name}`} className="app-list-row">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <p className="app-list-title truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% of tracked spending</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{formatUserCurrency(item.value, currencySettings)}</span>
                </div>

                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(percentage, 6)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
