import type { Expense } from "../App";
import { startOfMonth, toDateKey } from "./finance";

export type DailySpendingMap = Record<string, number>;

export type HeatmapDayDetail = {
  dateKey: string;
  totalSpent: number;
  transactionCount: number;
  intensity: number;
};

export function getDailySpendingMap(expenses: Expense[]) {
  return expenses.reduce<DailySpendingMap>((acc, expense) => {
    const dateKey = toDateKey(expense.date);
    acc[dateKey] = (acc[dateKey] || 0) + expense.amount;
    return acc;
  }, {});
}

export function getMonthlySpendingMap(expenses: Expense[], monthDate: Date) {
  const targetMonth = monthDate.getMonth();
  const targetYear = monthDate.getFullYear();

  return expenses.reduce<DailySpendingMap>((acc, expense) => {
    const expenseDate = new Date(expense.date);
    if (expenseDate.getMonth() !== targetMonth || expenseDate.getFullYear() !== targetYear) {
      return acc;
    }

    const dateKey = toDateKey(expenseDate);
    acc[dateKey] = (acc[dateKey] || 0) + expense.amount;
    return acc;
  }, {});
}

export function getIntensityLevel(amount: number, maxAmount: number, steps = 4) {
  if (amount <= 0 || maxAmount <= 0) {
    return 0;
  }

  return Math.min(steps, Math.max(1, Math.ceil((amount / maxAmount) * steps)));
}

export function buildMonthlyHeatmap(expenses: Expense[], monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setDate(firstVisibleDay.getDate() - firstVisibleDay.getDay());

  const dailySpending = getMonthlySpendingMap(expenses, monthDate);
  const maxAmount = Math.max(0, ...Object.values(dailySpending));
  const days: HeatmapDayDetail[] = [];

  for (let index = 0; index < 42; index += 1) {
    const currentDate = new Date(firstVisibleDay);
    currentDate.setDate(firstVisibleDay.getDate() + index);
    const dateKey = toDateKey(currentDate);
    const amount = dailySpending[dateKey] || 0;
    const count = expenses.filter((expense) => toDateKey(expense.date) === dateKey).length;

    days.push({
      dateKey,
      totalSpent: amount,
      transactionCount: count,
      intensity: getIntensityLevel(amount, maxAmount),
    });
  }

  return {
    monthStart: firstDay,
    maxAmount,
    dailySpending,
    days,
  };
}
