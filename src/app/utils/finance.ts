import type { BudgetPeriod, ComputationExemption, CustomWallet, Expense, Transaction } from "../App";

type BudgetAccount = Pick<
  CustomWallet,
  "balance" | "budgetAmount" | "budgetPeriod" | "lastBudgetReset" | "expenses"
> & {
  autoBudgetEnabled?: boolean;
};

export type BudgetMetrics = {
  budgetEnabled: boolean;
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  todaySpent: number;
  averageDailySpending: number;
  daysRemaining: number;
  weeksRemaining: number;
  monthsRemaining: number;
  overspentToday: boolean;
  todayExcluded: boolean;
  activeDaysInWeek: number;
  activeDaysInMonth: number;
};

export function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

export function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const diff = nextDate.getDate() - day + (day === 0 ? -6 : 1);
  nextDate.setDate(diff);
  return startOfDay(nextDate);
}

export function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date);
  nextDate.setDate(nextDate.getDate() + 6);
  return endOfDay(nextDate);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

export function toDateKey(date: Date | string) {
  return startOfDay(new Date(date)).toISOString().split("T")[0];
}

export function toDateInputValue(date: string) {
  return toDateKey(date);
}

export function isDateExempt(date: Date | string, exemptions: ComputationExemption[]) {
  const normalizedDate = startOfDay(new Date(date));

  return exemptions.some((exemption) => {
    const exemptionDate = startOfDay(new Date(exemption.date));

    switch (exemption.repeat) {
      case "weekly":
        return normalizedDate.getDay() === exemptionDate.getDay();
      case "monthly":
        return normalizedDate.getDate() === exemptionDate.getDate();
      case "yearly":
        return (
          normalizedDate.getMonth() === exemptionDate.getMonth() &&
          normalizedDate.getDate() === exemptionDate.getDate()
        );
      case "none":
      default:
        return normalizedDate.getTime() === exemptionDate.getTime();
    }
  });
}

export function countActiveDays(startDate: Date, endDate: Date, exemptions: ComputationExemption[]) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (start.getTime() > end.getTime()) {
    return 0;
  }

  let activeDays = 0;
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    if (!isDateExempt(cursor, exemptions)) {
      activeDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return activeDays;
}

export function filterExpensesForAnalysis(
  expenses: Expense[],
  exemptions: ComputationExemption[],
  range?: { start?: Date; end?: Date },
) {
  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    if (range?.start && expenseDate < range.start) return false;
    if (range?.end && expenseDate > range.end) return false;

    return !isDateExempt(expenseDate, exemptions);
  });
}

export function filterTransactionsForAnalysis(
  transactions: Transaction[],
  exemptions: ComputationExemption[],
  range?: { start?: Date; end?: Date },
) {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    if (range?.start && transactionDate < range.start) return false;
    if (range?.end && transactionDate > range.end) return false;

    return !isDateExempt(transactionDate, exemptions);
  });
}

function countAllocatableWeeklyPeriods(lastReset: Date, now: Date, exemptions: ComputationExemption[]) {
  let periodsToAllocate = 0;
  let cursor = startOfWeek(lastReset);
  cursor = addDays(cursor, 7);
  const currentWeekStart = startOfWeek(now);

  while (cursor.getTime() <= currentWeekStart.getTime()) {
    if (countActiveDays(cursor, endOfWeek(cursor), exemptions) > 0) {
      periodsToAllocate += 1;
    }
    cursor = addDays(cursor, 7);
  }

  return periodsToAllocate;
}

function countAllocatableMonthlyPeriods(lastReset: Date, now: Date, exemptions: ComputationExemption[]) {
  let periodsToAllocate = 0;
  let cursor = startOfMonth(addMonths(lastReset, 1));
  const currentMonthStart = startOfMonth(now);

  while (cursor.getTime() <= currentMonthStart.getTime()) {
    if (countActiveDays(cursor, endOfMonth(cursor), exemptions) > 0) {
      periodsToAllocate += 1;
    }
    cursor = startOfMonth(addMonths(cursor, 1));
  }

  return periodsToAllocate;
}

export function allocateBudgetForAccount<T extends BudgetAccount>(account: T, exemptions: ComputationExemption[]) {
  if (!account.autoBudgetEnabled || !account.budgetAmount || account.budgetAmount <= 0) {
    return account;
  }

  const now = new Date();
  const lastReset = new Date(account.lastBudgetReset);

  let periodsToAllocate = 0;

  if (account.budgetPeriod === "daily") {
    periodsToAllocate = countActiveDays(addDays(lastReset, 1), now, exemptions);
  } else if (account.budgetPeriod === "weekly") {
    periodsToAllocate = countAllocatableWeeklyPeriods(lastReset, now, exemptions);
  } else {
    periodsToAllocate = countAllocatableMonthlyPeriods(lastReset, now, exemptions);
  }

  if (periodsToAllocate <= 0) {
    return account;
  }

  return {
    ...account,
    balance: account.balance + account.budgetAmount * periodsToAllocate,
    lastBudgetReset: now.toISOString(),
  };
}

export function calculateBudgetMetrics(account: BudgetAccount, exemptions: ComputationExemption[]): BudgetMetrics {
  const budgetEnabled = account.autoBudgetEnabled ?? true;
  const today = startOfDay(new Date());
  const todayExcluded = isDateExempt(today, exemptions);
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);
  const activeDaysInWeek = countActiveDays(weekStart, endOfWeek(today), exemptions);
  const activeDaysInMonth = countActiveDays(monthStart, endOfMonth(today), exemptions);

  let dailyBudget = 0;
  let weeklyBudget = 0;
  let monthlyBudget = 0;

  if (budgetEnabled) {
    switch (account.budgetPeriod) {
      case "daily":
        dailyBudget = todayExcluded ? 0 : account.balance;
        weeklyBudget = dailyBudget * Math.max(activeDaysInWeek, 1);
        monthlyBudget = dailyBudget * Math.max(activeDaysInMonth, 1);
        break;
      case "weekly":
        weeklyBudget = account.balance;
        dailyBudget = activeDaysInWeek > 0 ? account.balance / activeDaysInWeek : 0;
        monthlyBudget = dailyBudget * Math.max(activeDaysInMonth, 1);
        break;
      case "monthly":
      default:
        monthlyBudget = account.balance;
        dailyBudget = activeDaysInMonth > 0 ? account.balance / activeDaysInMonth : 0;
        weeklyBudget = dailyBudget * Math.max(activeDaysInWeek, 1);
        break;
    }
  }

  const todayExpenses = filterExpensesForAnalysis(account.expenses, exemptions, {
    start: today,
    end: endOfDay(today),
  });
  const todaySpent = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const averageWindowStart = startOfDay(addDays(today, -6));
  const recentExpenses = filterExpensesForAnalysis(account.expenses, exemptions, {
    start: averageWindowStart,
    end: endOfDay(today),
  });
  const activeDaysInAverageWindow = countActiveDays(averageWindowStart, today, exemptions);
  const totalSpentLast7Days = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageDailySpending = activeDaysInAverageWindow > 0 ? totalSpentLast7Days / activeDaysInAverageWindow : 0;

  const daysRemaining = averageDailySpending > 0 ? Math.floor(account.balance / averageDailySpending) : Infinity;
  const weeksRemaining = daysRemaining === Infinity ? Infinity : daysRemaining / Math.max(activeDaysInWeek || 7, 1);
  const monthsRemaining = daysRemaining === Infinity ? Infinity : daysRemaining / Math.max(activeDaysInMonth || 30, 1);

  return {
    budgetEnabled,
    dailyBudget,
    weeklyBudget,
    monthlyBudget,
    todaySpent,
    averageDailySpending,
    daysRemaining,
    weeksRemaining,
    monthsRemaining,
    overspentToday: budgetEnabled && !todayExcluded && todaySpent > dailyBudget,
    todayExcluded,
    activeDaysInWeek,
    activeDaysInMonth,
  };
}

export function sortByDateDescending<T extends { date: string }>(records: T[]) {
  return [...records].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}
