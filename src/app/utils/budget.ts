import type { BudgetPeriod, UserData } from "../App";
import {
  allocateBudgetForAccount,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "./finance";

/**
 * Checks whether new budget periods have started and allocates budget if needed.
 * Exempted days are ignored when catching up missed allocations.
 */
export function checkAndAllocateBudget(userData: UserData): UserData {
  const nextMainAccount = allocateBudgetForAccount(
    {
      balance: userData.balance,
      budgetAmount: userData.budgetAmount,
      budgetPeriod: userData.budgetPeriod,
      lastBudgetReset: userData.lastBudgetReset,
      expenses: userData.expenses,
      autoBudgetEnabled: true,
    },
    userData.computationExemptions,
  );

  const nextWallets = userData.wallets.map((wallet) =>
    allocateBudgetForAccount(wallet, userData.computationExemptions),
  );

  return {
    ...userData,
    balance: nextMainAccount.balance,
    lastBudgetReset: nextMainAccount.lastBudgetReset,
    wallets: nextWallets,
  };
}

/**
 * Gets the start date of the current budget period.
 */
export function getCurrentPeriodStart(budgetPeriod: BudgetPeriod, referenceDate: Date): Date {
  const now = new Date(referenceDate);

  if (budgetPeriod === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (budgetPeriod === "weekly") {
    return startOfWeek(now);
  }

  return startOfMonth(now);
}

export function getCurrentPeriodEnd(budgetPeriod: BudgetPeriod, referenceDate: Date): Date {
  const now = new Date(referenceDate);

  if (budgetPeriod === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  if (budgetPeriod === "weekly") {
    return endOfWeek(now);
  }

  return endOfMonth(now);
}
