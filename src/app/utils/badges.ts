import type { Expense, UserData } from "../App";
import { formatUserCurrency } from "./currency";
import { countActiveDays, filterExpensesForAnalysis } from "./finance";

export type BadgeLevel = "bronze" | "silver" | "gold";

export type Badge = {
  id: string;
  name: string;
  description: string;
  level: BadgeLevel;
  icon: string;
  earned: boolean;
  progress?: number; // 0-100 percentage
  category: "streak" | "savings" | "discipline" | "category";
};

// Badge thresholds
const STREAK_BADGES = [
  { days: 100, level: "bronze" as BadgeLevel, name: "Century Streak", description: "Opened the app for 100 consecutive days" },
  { days: 365, level: "silver" as BadgeLevel, name: "1 Year Streak", description: "Opened the app for 1 year straight" },
  { days: 730, level: "gold" as BadgeLevel, name: "2 Year Streak", description: "Opened the app for 2 years straight" },
  { days: 1095, level: "gold" as BadgeLevel, name: "3 Year Streak", description: "Opened the app for 3 years straight" },
];

const SAVINGS_BADGES = [
  { amount: 1000, level: "bronze" as BadgeLevel, name: "Saver Starter", description: "Saved ₱1,000" },
  { amount: 3000, level: "silver" as BadgeLevel, name: "Thrifty Saver", description: "Saved ₱3,000" },
  { amount: 5000, level: "gold" as BadgeLevel, name: "Savings Master", description: "Saved ₱5,000" },
  { amount: 10000, level: "gold" as BadgeLevel, name: "Wealth Builder", description: "Saved ₱10,000" },
  { amount: 25000, level: "gold" as BadgeLevel, name: "Financial Guru", description: "Saved ₱25,000" },
];

const DISCIPLINE_BADGES = [
  { period: "week", level: "bronze" as BadgeLevel, name: "Week of Discipline", description: "A week without overspending" },
  { period: "month", level: "silver" as BadgeLevel, name: "Month of Control", description: "A month without overspending" },
  { period: "year", level: "gold" as BadgeLevel, name: "Year of Mastery", description: "A year without overspending" },
];

const CATEGORY_BADGES = [
  { amount: 5000, level: "bronze" as BadgeLevel, name: "Category Novice", description: "Spent ₱5,000 in a category" },
  { amount: 15000, level: "silver" as BadgeLevel, name: "Category Expert", description: "Spent ₱15,000 in a category" },
  { amount: 30000, level: "gold" as BadgeLevel, name: "Category Master", description: "Spent ₱30,000 in a category" },
];

// Helper function to check if user has overspent in a period
function hasOverspentInPeriod(userData: UserData, startDate: Date, endDate: Date): boolean {
  const periodExpenses = filterExpensesForAnalysis(userData.expenses, userData.computationExemptions, {
    start: startDate,
    end: endDate,
  });
  
  // Calculate total spent
  const totalSpent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Check against budget
  // For simplicity, we'll check if they spent more than their budget amount
  // This is a simplified check - you might want to make this more sophisticated
  const periodBudget = calculatePeriodBudget(userData, startDate, endDate);
  
  return totalSpent > periodBudget;
}

function calculatePeriodBudget(userData: UserData, startDate: Date, endDate: Date): number {
  const activeDays = countActiveDays(startDate, endDate, userData.computationExemptions);
  
  switch (userData.budgetPeriod) {
    case "daily":
      return userData.budgetAmount * activeDays;
    case "weekly":
      return userData.budgetAmount * Math.ceil(activeDays / 7);
    case "monthly":
      return userData.budgetAmount * Math.ceil(activeDays / 30);
    default:
      return 0;
  }
}

// Get category spending totals
function getCategoryTotals(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  expenses.forEach(expense => {
    if (!totals[expense.category]) {
      totals[expense.category] = 0;
    }
    totals[expense.category] += expense.amount;
  });
  
  return totals;
}

// Calculate all badges for a user
export function calculateBadges(userData: UserData): Badge[] {
  const badges: Badge[] = [];
  const currentStreak = userData.currentStreak || 0;
  const totalSavings = userData.savings || 0;
  const analysisExpenses = filterExpensesForAnalysis(userData.expenses, userData.computationExemptions);
  const categoryTotals = getCategoryTotals(analysisExpenses);
  
  // Streak badges
  STREAK_BADGES.forEach((badge, index) => {
    const earned = currentStreak >= badge.days;
    const progress = Math.min(100, (currentStreak / badge.days) * 100);
    
    badges.push({
      id: `streak-${index}`,
      name: badge.name,
      description: badge.description,
      level: badge.level,
      icon: "🔥",
      earned,
      progress,
      category: "streak",
    });
  });
  
  // Savings badges
  SAVINGS_BADGES.forEach((badge, index) => {
    const earned = totalSavings >= badge.amount;
    const progress = Math.min(100, (totalSavings / badge.amount) * 100);
    
    badges.push({
      id: `savings-${index}`,
      name: badge.name,
      description: `Saved ${formatUserCurrency(badge.amount, userData.currencySettings)}`,
      level: badge.level,
      icon: "💰",
      earned,
      progress,
      category: "savings",
    });
  });
  
  // Discipline badges
  const today = new Date();
  
  // Week without overspending
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekDiscipline = !hasOverspentInPeriod(userData, weekAgo, today);
  
  // Month without overspending
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthDiscipline = !hasOverspentInPeriod(userData, monthAgo, today);
  
  // Year without overspending
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearDiscipline = !hasOverspentInPeriod(userData, yearAgo, today);
  
  badges.push({
    id: "discipline-week",
    name: DISCIPLINE_BADGES[0].name,
    description: DISCIPLINE_BADGES[0].description,
    level: DISCIPLINE_BADGES[0].level,
    icon: "✅",
    earned: weekDiscipline,
    progress: weekDiscipline ? 100 : 0,
    category: "discipline",
  });
  
  badges.push({
    id: "discipline-month",
    name: DISCIPLINE_BADGES[1].name,
    description: DISCIPLINE_BADGES[1].description,
    level: DISCIPLINE_BADGES[1].level,
    icon: "✅",
    earned: monthDiscipline,
    progress: monthDiscipline ? 100 : 0,
    category: "discipline",
  });
  
  badges.push({
    id: "discipline-year",
    name: DISCIPLINE_BADGES[2].name,
    description: DISCIPLINE_BADGES[2].description,
    level: DISCIPLINE_BADGES[2].level,
    icon: "✅",
    earned: yearDiscipline,
    progress: yearDiscipline ? 100 : 0,
    category: "discipline",
  });
  
  // Category master badges
  const maxCategorySpending = Math.max(...Object.values(categoryTotals), 0);
  
  CATEGORY_BADGES.forEach((badge, index) => {
    const earned = maxCategorySpending >= badge.amount;
    const progress = Math.min(100, (maxCategorySpending / badge.amount) * 100);
    
    badges.push({
      id: `category-${index}`,
      name: badge.name,
      description: `Spent ${formatUserCurrency(badge.amount, userData.currencySettings)} in one category`,
      level: badge.level,
      icon: "🏆",
      earned,
      progress,
      category: "category",
    });
  });
  
  return badges;
}

// Get badge color based on level and earned status
export function getBadgeColor(level: BadgeLevel, earned: boolean): string {
  if (!earned) {
    return "text-gray-400 dark:text-gray-600";
  }
  
  switch (level) {
    case "bronze":
      return "text-orange-600 dark:text-orange-400";
    case "silver":
      return "text-gray-500 dark:text-gray-300";
    case "gold":
      return "text-yellow-500 dark:text-yellow-400";
    default:
      return "text-gray-400";
  }
}

// Get badge background based on level and earned status
export function getBadgeBackground(level: BadgeLevel, earned: boolean): string {
  if (!earned) {
    return "bg-gray-100 dark:bg-gray-800";
  }
  
  switch (level) {
    case "bronze":
      return "bg-orange-50 dark:bg-orange-950/30";
    case "silver":
      return "bg-gray-50 dark:bg-gray-900/30";
    case "gold":
      return "bg-yellow-50 dark:bg-yellow-950/30";
    default:
      return "bg-gray-100 dark:bg-gray-800";
  }
}
