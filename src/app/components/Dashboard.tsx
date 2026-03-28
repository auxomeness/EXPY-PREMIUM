import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Calendar, CalendarDays, CalendarRange, Flame, Plus, TrendingDown, Wallet, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type { Expense, Transaction, UserData } from "../App";
import { calculateBudgetMetrics, filterExpensesForAnalysis, isDateExempt, sortByDateDescending } from "../utils/finance";
import { checkAndAllocateBudget } from "../utils/budget";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";
import { createDefaultUserData, getUserData, saveUserData, subscribeToUserData, updateUserData } from "../utils/userData";
import { checkAndSendDailyNotification } from "../utils/notifications";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { AddMoneyDialog } from "./AddMoneyDialog";
import { BadgesDisplay } from "./BadgesDisplay";
import { ExpenseChart } from "./ExpenseChart";
import { ExemptionManagerDialog } from "./ExemptionManagerDialog";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { UndoNotification } from "./UndoNotification";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

type DashboardProps = {
  username: string;
};

export function Dashboard({ username }: DashboardProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showExemptionManager, setShowExemptionManager] = useState(false);
  const [showThresholdAlert, setShowThresholdAlert] = useState(false);
  const [dismissedThresholdAlert, setDismissedThresholdAlert] = useState(false);
  const [dismissedOverspentAlert, setDismissedOverspentAlert] = useState(false);
  const [dismissedSustainAlert, setDismissedSustainAlert] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    message: string;
    previousUserData: UserData;
  } | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      const storedUserData = getUserData(username);
      if (!storedUserData) return;

      const budgetAdjustedUserData = checkAndAllocateBudget(storedUserData);
      if (JSON.stringify(storedUserData) !== JSON.stringify(budgetAdjustedUserData)) {
        saveUserData(username, budgetAdjustedUserData);
      }

      setUserData(budgetAdjustedUserData);
    };

    loadUserData();

    return subscribeToUserData(username, (nextUserData) => {
      setUserData(checkAndAllocateBudget(nextUserData));
    });
  }, [username]);

  useEffect(() => {
    checkAndSendDailyNotification(userData);
  }, [userData]);

  const todayExcluded = isDateExempt(new Date(), userData.computationExemptions);
  const budgetMetrics = useMemo(
    () =>
      calculateBudgetMetrics(
        {
          balance: userData.balance,
          budgetAmount: userData.budgetAmount,
          budgetPeriod: userData.budgetPeriod,
          lastBudgetReset: userData.lastBudgetReset,
          expenses: userData.expenses,
        },
        userData.computationExemptions,
      ),
    [userData.balance, userData.budgetAmount, userData.budgetPeriod, userData.lastBudgetReset, userData.expenses, userData.computationExemptions],
  );
  const analysisExpenses = useMemo(
    () => filterExpensesForAnalysis(userData.expenses, userData.computationExemptions),
    [userData.expenses, userData.computationExemptions],
  );
  const recentExpenses = useMemo(
    () => sortByDateDescending(userData.expenses).slice(0, 3),
    [userData.expenses],
  );

  useEffect(() => {
    if (userData.initialBalance > 0) {
      const thresholdAmount = (userData.thresholdPercentage / 100) * userData.initialBalance;
      setShowThresholdAlert(userData.balance <= thresholdAmount && userData.balance > 0);
      return;
    }

    setShowThresholdAlert(false);
  }, [userData.balance, userData.initialBalance, userData.thresholdPercentage]);

  const persistMainAccount = (updater: (currentUserData: UserData) => UserData, message?: string) => {
    const previousUserData = userData;
    const nextUserData = updateUserData(username, updater);
    if (!nextUserData) return;

    if (message) {
      setUndoSnapshot({
        message,
        previousUserData,
      });
    }
  };

  const handleAddMoney = (amount: number, period: import("../App").BudgetPeriod) => {
    const amountInBaseCurrency = convertToBaseCurrency(amount, userData.currencySettings);
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "add_money",
      amount: amountInBaseCurrency,
      date: new Date().toISOString(),
    };

    persistMainAccount(
      (currentUserData) => ({
        ...currentUserData,
        balance: currentUserData.balance + amountInBaseCurrency,
        initialBalance: currentUserData.initialBalance + amountInBaseCurrency,
        budgetPeriod: period,
        transactions: [transaction, ...currentUserData.transactions],
      }),
      `Added ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} to Main Balance`,
    );

    setShowAddMoney(false);
  };

  const handleAddExpense = (expense: Omit<Expense, "id" | "date">) => {
    const amountInBaseCurrency = convertToBaseCurrency(expense.amount, userData.currencySettings);
    const newExpense: Expense = {
      ...expense,
      amount: amountInBaseCurrency,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const transaction: Transaction = {
      id: newExpense.id,
      type: "expense",
      amount: amountInBaseCurrency,
      category: expense.category,
      description: expense.description,
      date: newExpense.date,
    };

    persistMainAccount(
      (currentUserData) => ({
        ...currentUserData,
        balance: currentUserData.balance - amountInBaseCurrency,
        expenses: [newExpense, ...currentUserData.expenses],
        transactions: [transaction, ...currentUserData.transactions],
      }),
      `Added expense: ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)}`,
    );
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;

    saveUserData(username, undoSnapshot.previousUserData);
    setUndoSnapshot(null);
  };

  const handleUpdateCategories = (categories: string[]) => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      customCategories: categories,
    }));
  };

  const handleExcludeToday = () => {
    if (todayExcluded) return;

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      computationExemptions: [
        ...currentUserData.computationExemptions,
        {
          id: `exemption-today-${Date.now()}`,
          name: "Exclude Today",
          date: new Date().toISOString(),
          repeat: "none",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const thresholdAmount = (userData.thresholdPercentage / 100) * userData.initialBalance;
  const todayDifference = budgetMetrics.dailyBudget - budgetMetrics.todaySpent;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="min-w-0 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Main Balance</p>
          <h1 className="page-title">Welcome back, {userData.displayName || username}!</h1>
          <div className="header-stats-row">
            {userData.currentStreak > 0 && (
              <div className="header-stat-card">
                <div className="header-stat-icon">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <p className="header-stat-label">Streak</p>
                  <p className="header-stat-value">{userData.currentStreak}</p>
                </div>
              </div>
            )}
            <BadgesDisplay userData={userData} variant="dashboard" />
          </div>
        </div>
      </div>

      <Card className="hero-card border-0">
        <CardContent className="relative space-y-5 overflow-hidden pt-5">
          <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-primary-foreground/72">Current Balance</p>
              <p className="mt-2 text-[2.45rem] font-semibold tracking-[-0.05em] text-primary-foreground">
                {formatUserCurrency(userData.balance, userData.currencySettings)}
              </p>
            </div>
            <div className="rounded-full border border-white/12 bg-white/10 p-3">
              <Wallet className="h-5 w-5 text-primary-foreground/80" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setShowAddMoney(true)} size="lg" variant="secondary" className="w-full">
              <Plus className="mr-1 h-4 w-4" />
              Add Money
            </Button>
            <Button
              onClick={() => setShowAddExpense(true)}
              size="lg"
              variant="outline"
              className="w-full border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
            >
              <TrendingDown className="mr-1 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {showThresholdAlert && !dismissedThresholdAlert && (
        <Alert className="relative border-orange-500 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="pr-8 text-orange-800 dark:text-orange-200">
            Main Balance is below {userData.thresholdPercentage}% of its tracked amount (
            {formatUserCurrency(thresholdAmount, userData.currencySettings)}).
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900"
            onClick={() => setDismissedThresholdAlert(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {!budgetMetrics.todayExcluded && budgetMetrics.overspentToday && !dismissedOverspentAlert && (
        <Alert className="relative border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="pr-8 text-red-800 dark:text-red-200">
            You've overspent today in Main Balance. Spent{" "}
            {formatUserCurrency(budgetMetrics.todaySpent, userData.currencySettings)} out of a daily budget of{" "}
            {formatUserCurrency(budgetMetrics.dailyBudget, userData.currencySettings)}.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
            onClick={() => setDismissedOverspentAlert(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {budgetMetrics.daysRemaining !== Infinity &&
        budgetMetrics.daysRemaining < 30 &&
        userData.balance > 0 &&
        !dismissedSustainAlert && (
          <Alert className="relative border-yellow-500 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="pr-8 text-yellow-800 dark:text-yellow-200">
              {budgetMetrics.daysRemaining < 1
                ? "At the current non-exempt spending rate, Main Balance will not last another active day."
                : `At the current non-exempt spending rate, Main Balance can sustain for about ${budgetMetrics.daysRemaining} more active day${budgetMetrics.daysRemaining === 1 ? "" : "s"}.`}
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
              onClick={() => setDismissedSustainAlert(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Spending Budget</CardTitle>
            <Button variant={todayExcluded ? "secondary" : "outline"} size="sm" onClick={() => setShowExemptionManager(true)}>
              {todayExcluded ? "Today Excluded" : "Exclude Today"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="muted-tile py-3 text-center">
              <Calendar className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
              <p className="mb-1 text-[11px] text-muted-foreground">Per Day</p>
              <p className="text-sm">{formatUserCurrency(budgetMetrics.dailyBudget, userData.currencySettings)}</p>
            </div>
            <div className="muted-tile py-3 text-center">
              <CalendarDays className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
              <p className="mb-1 text-[11px] text-muted-foreground">Per Week</p>
              <p className="text-sm">{formatUserCurrency(budgetMetrics.weeklyBudget, userData.currencySettings)}</p>
            </div>
            <div className="muted-tile py-3 text-center">
              <CalendarRange className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
              <p className="mb-1 text-[11px] text-muted-foreground">Per Month</p>
              <p className="text-sm">{formatUserCurrency(budgetMetrics.monthlyBudget, userData.currencySettings)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {userData.computationExemptions.length === 0
              ? "No exempted days are configured."
              : `${userData.computationExemptions.length} exempted day configuration${userData.computationExemptions.length === 1 ? "" : "s"} currently shape these calculations.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Spending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgetMetrics.todayExcluded ? (
            <div className="app-empty-state text-sm text-muted-foreground">
              Today's activity is still recorded, but it won't affect automatic calculations.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="muted-tile py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Daily Budget</p>
                  <p className="mt-1.5 text-base font-semibold">{formatUserCurrency(budgetMetrics.dailyBudget, userData.currencySettings)}</p>
                </div>
                <div className="muted-tile py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Spent Today</p>
                  <p className={`mt-1.5 text-base font-semibold ${budgetMetrics.overspentToday ? "text-red-600 dark:text-red-400" : ""}`}>
                    {formatUserCurrency(budgetMetrics.todaySpent, userData.currencySettings)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/25 px-4 py-3">
                <span className="text-sm font-medium">
                  {budgetMetrics.todaySpent < budgetMetrics.dailyBudget ? "Saved Today" : "Overspent"}
                </span>
                <span
                  className={`text-sm font-medium ${
                    todayDifference >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {todayDifference >= 0 ? "+" : ""}
                  {formatUserCurrency(todayDifference, userData.currencySettings)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Daily progress</span>
                  <span>
                    {budgetMetrics.dailyBudget > 0
                      ? `${Math.min((budgetMetrics.todaySpent / budgetMetrics.dailyBudget) * 100, 100).toFixed(0)}% used`
                      : "0% used"}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    budgetMetrics.dailyBudget > 0 ? (budgetMetrics.todaySpent / budgetMetrics.dailyBudget) * 100 : 0,
                    100,
                  )}
                  className={budgetMetrics.overspentToday ? "[&_[data-slot=progress-indicator]]:bg-destructive" : ""}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ExpenseChart expenses={analysisExpenses} currencySettings={userData.currencySettings} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <div className="app-empty-state space-y-3">
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
              <Button onClick={() => setShowAddExpense(true)} variant="outline" size="sm">
                Add Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => {
                const expenseExcluded = isDateExempt(new Date(expense.date), userData.computationExemptions);

                return (
                  <div key={expense.id} className="app-list-row flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="app-list-title truncate capitalize">{expense.description || expense.category}</p>
                      <p className="app-list-meta">
                        {new Date(expense.date).toLocaleDateString()}
                        {expenseExcluded ? " • Exempted from analytics" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        -{formatUserCurrency(expense.amount, userData.currencySettings)}
                      </p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">{expense.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddMoneyDialog
        open={showAddMoney}
        onOpenChange={setShowAddMoney}
        onAddMoney={handleAddMoney}
        currencyCode={userData.currencySettings.preferredCurrency}
        accountLabel="Main Balance"
      />

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onAddExpense={handleAddExpense}
        currentBalance={userData.balance}
        customCategories={userData.customCategories || []}
        onManageCategories={() => setShowManageCategories(true)}
        currencySettings={userData.currencySettings}
        accountLabel="Main Balance"
      />

      <ManageCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
        customCategories={userData.customCategories || []}
        onUpdateCategories={handleUpdateCategories}
      />

      <ExemptionManagerDialog
        open={showExemptionManager}
        onOpenChange={setShowExemptionManager}
        exemptions={userData.computationExemptions}
        onChange={(nextExemptions) =>
          updateUserData(username, (currentUserData) => ({
            ...currentUserData,
            computationExemptions: nextExemptions,
          }))
        }
        onExcludeToday={handleExcludeToday}
        todayExcluded={todayExcluded}
      />

      <AnimatePresence>
        {undoSnapshot && (
          <UndoNotification
            message={undoSnapshot.message}
            onUndo={handleUndo}
            onComplete={() => setUndoSnapshot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
