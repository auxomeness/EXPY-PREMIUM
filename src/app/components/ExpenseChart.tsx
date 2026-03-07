import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "../App";
import { formatCurrency } from "../utils/currency";

type ExpenseChartProps = {
  expenses: Expense[];
};

const DEFAULT_COLORS: Record<string, string> = {
  leisure: "#8b5cf6",
  bills: "#ef4444",
  transportation: "#3b82f6",
  food: "#22c55e",
  other: "#6b7280",
};

// Generate a color for custom categories
const generateColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<Expense["category"], number>);

  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount,
    color: DEFAULT_COLORS[category] || generateColor(category),
  }));

  if (chartData.length === 0) {
    return null;
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Visual breakdown of your expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value as number)} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(0);
            return (
              <div key={`category-${index}-${item.name}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <span className="text-xs text-muted-foreground">({percentage}%)</span>
                </div>
                <span className="text-sm">{formatCurrency(item.value)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
