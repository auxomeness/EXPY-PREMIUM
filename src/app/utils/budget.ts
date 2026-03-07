import { UserData, BudgetPeriod } from "../App";

/**
 * Checks if a new budget period has started and allocates budget if needed
 * Returns updated user data with new balance if budget was allocated
 */
export function checkAndAllocateBudget(userData: UserData): UserData {
  // If no budget amount is set, return as is
  if (!userData.budgetAmount || userData.budgetAmount === 0) {
    return userData;
  }

  const now = new Date();
  const lastReset = new Date(userData.lastBudgetReset);
  
  let shouldAllocate = false;
  
  if (userData.budgetPeriod === "daily") {
    // Check if it's a new day
    const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    shouldAllocate = todayDay.getTime() > lastResetDay.getTime();
  } else if (userData.budgetPeriod === "weekly") {
    // Check if it's a new week (weeks start on Monday)
    const daysSinceLastReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    shouldAllocate = daysSinceLastReset >= 7;
  } else if (userData.budgetPeriod === "monthly") {
    // Check if it's a new month
    shouldAllocate = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  }
  
  if (shouldAllocate) {
    // Calculate how many periods have passed
    let periodsToAllocate = 1;
    
    if (userData.budgetPeriod === "daily") {
      const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
      const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodsToAllocate = Math.floor((todayDay.getTime() - lastResetDay.getTime()) / (1000 * 60 * 60 * 24));
    } else if (userData.budgetPeriod === "weekly") {
      periodsToAllocate = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24 * 7));
    } else if (userData.budgetPeriod === "monthly") {
      const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
      periodsToAllocate = monthsDiff;
    }
    
    // Add budget for all missed periods
    const newBalance = userData.balance + (userData.budgetAmount * periodsToAllocate);
    
    return {
      ...userData,
      balance: newBalance,
      lastBudgetReset: now.toISOString(),
    };
  }
  
  return userData;
}

/**
 * Gets the start date of the current budget period
 */
export function getCurrentPeriodStart(budgetPeriod: BudgetPeriod, lastReset: Date): Date {
  const now = new Date();
  
  if (budgetPeriod === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (budgetPeriod === "weekly") {
    // Find the start of the current week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(now.getFullYear(), now.getMonth(), diff);
  } else {
    // Monthly
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
