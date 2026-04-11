import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Calendar, CalendarDays, CalendarRange, Plus, TrendingDown, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Account, Expense, Transaction, UserData } from "../App";
import { calculateBudgetMetrics, filterExpensesForAnalysis, isDateExempt, sortByDateDescending } from "../utils/finance";
import { checkAndAllocateBudget } from "../utils/budget";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";
import { ACCOUNT_THEME_STYLES, collectAllExpenses, getHomeDisplayAccount, updateAccountInUserData } from "../utils/accounts";
import { getMonthlySubscriptionTotal, hasPlusAccess, hasProAccess } from "../utils/premium";
import { calculateSelectableTotalBalance, createDefaultUserData, generateEntityId, getHeroVisibleAccounts, getPrimaryAccount, getUserData, saveUserData, subscribeToUserData, updateUserData } from "../utils/userData";
import { checkAndSendDailyNotification } from "../utils/notifications";
import { AccountSurfaceCard } from "./AccountSurfaceCard";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { AddMoneyDialog } from "./AddMoneyDialog";
import { BadgesDisplay } from "./BadgesDisplay";
import { ExpenseChart } from "./ExpenseChart";
import { ExemptionManagerDialog } from "./ExemptionManagerDialog";
import { LockedFeatureCard } from "./LockedFeatureCard";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { PlanBadge } from "./PlanBadge";
import { FilledFlameIcon } from "./PremiumIcons";
import { SpendingHeatmapCalendar } from "./SpendingHeatmapCalendar";
import { UndoNotification } from "./UndoNotification";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

type DashboardProps = {
  username: string;
  onOpenPremium: () => void;
};

const DASHBOARD_WARNING_IDS = {
  threshold: "threshold-balance-warning",
  overspent: "overspent-today-warning",
  sustain: "low-sustain-warning",
} as const;

export function Dashboard({ username, onOpenPremium }: DashboardProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showExemptionManager, setShowExemptionManager] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    message: string;
    previousUserData: UserData;
  } | null>(null);
  const [heroAnimationDirection, setHeroAnimationDirection] = useState<1 | -1>(1);
  const heroGestureStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const reduceMotion = useReducedMotion();

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
  const allExpenses = useMemo(() => collectAllExpenses(userData), [userData]);
  const plusAccess = hasPlusAccess(userData);
  const proAccess = hasProAccess(userData);
  const totalBalance = useMemo(() => calculateSelectableTotalBalance(userData), [userData]);
  const primaryAccount = useMemo(() => getPrimaryAccount(userData), [userData]);
  const selectedHomeAccount = useMemo(() => getHomeDisplayAccount(userData), [userData]);
  const heroVisibleAccounts = useMemo(() => getHeroVisibleAccounts(userData), [userData]);
  const heroAccounts = useMemo(
    () => (heroVisibleAccounts.length > 0 ? heroVisibleAccounts : [selectedHomeAccount]),
    [heroVisibleAccounts, selectedHomeAccount],
  );
  const activeHeroAccount = useMemo(
    () => heroAccounts.find((account) => account.id === userData.preferences.homeSelectedAccountId) ?? heroAccounts[0] ?? selectedHomeAccount,
    [heroAccounts, selectedHomeAccount, userData.preferences.homeSelectedAccountId],
  );
  const heroCardAccount = useMemo<Account>(() => activeHeroAccount, [activeHeroAccount]);
  const heroIsMainCard = activeHeroAccount.id === primaryAccount.id && activeHeroAccount.accountType === "cash";
  const heroBrandLabel = useMemo(
    () => (heroIsMainCard || activeHeroAccount.theme === "custom_card" || activeHeroAccount.accountType === "cash" ? activeHeroAccount.name : ACCOUNT_THEME_STYLES[activeHeroAccount.theme].label),
    [activeHeroAccount, heroIsMainCard],
  );
  const heroBrandSubLabel = heroIsMainCard ? "MAIN CARD" : undefined;
  const heroAccountValue = heroIsMainCard ? userData.displayName || username : undefined;
  const heroAllowsExpense = activeHeroAccount.accountType !== "savings_account";
  const heroPrimaryLabel = activeHeroAccount.balanceModel === "credit" ? "Pay Card" : "Add Money";
  const monthlySubscriptionTotal = useMemo(() => getMonthlySubscriptionTotal(userData.subscriptions), [userData.subscriptions]);
  const headerTilesGridClassName = userData.currentStreak > 0 ? "grid-cols-3" : "grid-cols-2";
  const dismissedDashboardWarnings = useMemo(
    () => new Set(userData.preferences.dismissedDashboardWarningIds),
    [userData.preferences.dismissedDashboardWarningIds],
  );
  const advancedSummaryMetrics = useMemo(
    () => ({
      trackedAccounts: userData.accounts.filter((account) => !account.archived).length,
      walletCount: userData.wallets.filter((wallet) => !wallet.archived).length,
      subscriptions: userData.subscriptions.filter((subscription) => subscription.status === "active").length,
    }),
    [userData.accounts, userData.subscriptions, userData.wallets],
  );

  const dismissDashboardWarning = (warningId: string) => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      preferences: {
        ...currentUserData.preferences,
        dismissedDashboardWarningIds: Array.from(new Set([...currentUserData.preferences.dismissedDashboardWarningIds, warningId])),
      },
    }));
  };

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
      id: generateEntityId("money"),
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
      id: generateEntityId("expense"),
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
  const showThresholdAlert = userData.initialBalance > 0 && userData.balance <= thresholdAmount && userData.balance > 0;

  const persistTrackedAccount = (accountId: string, updater: (account: Account) => Account, message: string) => {
    const previousUserData = userData;
    const nextUserData = updateUserData(username, (currentUserData) => {
      const currentAccount = currentUserData.accounts.find((account) => account.id === accountId);
      if (!currentAccount) return currentUserData;

      return updateAccountInUserData(currentUserData, updater(currentAccount));
    });

    if (!nextUserData) return;

    setUndoSnapshot({
      message,
      previousUserData,
    });
  };

  const handleHeroPrimaryAction = () => {
    setShowAddMoney(true);
  };

  const handleHeroAddMoney = (amount: number) => {
    const amountInBaseCurrency = convertToBaseCurrency(amount, userData.currencySettings);
    const now = new Date().toISOString();

    if (activeHeroAccount.balanceModel === "credit") {
      const paymentTransaction: Transaction = {
        id: generateEntityId("credit-payment"),
        type: "credit_payment",
        amount: amountInBaseCurrency,
        date: now,
        relatedAccountId: activeHeroAccount.id,
      };

      persistTrackedAccount(
        activeHeroAccount.id,
        (account) => ({
          ...account,
          usedCredit: Math.max(0, account.usedCredit - amountInBaseCurrency),
          transactions: [paymentTransaction, ...account.transactions],
          updatedAt: now,
        }),
        `Paid ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} to ${activeHeroAccount.name}`,
      );
    } else {
      const addMoneyTransaction: Transaction = {
        id: generateEntityId("money"),
        type: "add_money",
        amount: amountInBaseCurrency,
        date: now,
        relatedAccountId: activeHeroAccount.id,
      };

      persistTrackedAccount(
        activeHeroAccount.id,
        (account) => ({
          ...account,
          balance: account.balance + amountInBaseCurrency,
          initialBalance: account.initialBalance + amountInBaseCurrency,
          transactions: [addMoneyTransaction, ...account.transactions],
          updatedAt: now,
        }),
        `Added ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} to ${activeHeroAccount.name}`,
      );
    }

    setShowAddMoney(false);
  };

  const handleHeroAddExpense = (expense: Omit<Expense, "id" | "date">) => {
    if (!heroAllowsExpense) {
      return;
    }

    const amountInBaseCurrency = convertToBaseCurrency(expense.amount, userData.currencySettings);
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      amount: amountInBaseCurrency,
      id: generateEntityId("expense"),
      date: now,
    };
    const expenseTransaction: Transaction = {
      id: newExpense.id,
      type: "expense",
      amount: amountInBaseCurrency,
      category: expense.category,
      description: expense.description,
      date: now,
      relatedAccountId: activeHeroAccount.id,
    };

    persistTrackedAccount(
      activeHeroAccount.id,
      (account) => ({
        ...account,
        balance: account.balanceModel === "credit" ? account.balance : account.balance - amountInBaseCurrency,
        usedCredit: account.balanceModel === "credit" ? account.usedCredit + amountInBaseCurrency : account.usedCredit,
        expenses: [newExpense, ...account.expenses],
        transactions: [expenseTransaction, ...account.transactions],
        updatedAt: now,
      }),
      `Added expense: ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} in ${activeHeroAccount.name}`,
    );

    setShowAddExpense(false);
  };

  const handleCycleHeroMode = (direction: "next" | "previous" = "next") => {
    if (!userData.preferences.homeHeroSwipeEnabled || heroAccounts.length <= 1) {
      return;
    }

    setHeroAnimationDirection(direction === "next" ? 1 : -1);

    const currentIndex = heroAccounts.findIndex((account) => account.id === activeHeroAccount.id);
    const nextAccount =
      direction === "next"
        ? heroAccounts[(currentIndex + 1) % heroAccounts.length]
        : heroAccounts[(currentIndex - 1 + heroAccounts.length) % heroAccounts.length];

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      preferences: {
        ...currentUserData.preferences,
        homeHeroMode: "selected_account",
        homeSelectedAccountId: nextAccount.id,
      },
    }));
  };

  const handleHeroPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!userData.preferences.homeHeroSwipeEnabled) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, select, [data-slot='button']")) {
      heroGestureStartRef.current = null;
      return;
    }

    heroGestureStartRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHeroPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = heroGestureStartRef.current;
    heroGestureStartRef.current = null;
    if (!start) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (start.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.1;

    if (!horizontalIntent || Math.abs(deltaX) < 38) {
      return;
    }

    handleCycleHeroMode(deltaX < 0 ? "next" : "previous");
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="min-w-0 w-full space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Main Balance</p>
          <h1 className="page-title">Welcome back, {userData.displayName || username}!</h1>
          <div className={`grid w-full items-stretch gap-2 ${headerTilesGridClassName}`}>
            {userData.currentStreak > 0 && (
              <div className="header-stat-card header-stat-card-balanced w-full min-w-0">
                <div className="header-stat-card-group">
                  <FilledFlameIcon className="h-6 w-6 shrink-0 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.36)] dark:text-orange-300" />
                  <div className="min-w-0 text-center">
                    <p className="header-stat-label">Streak</p>
                    <p className="header-stat-value truncate">{userData.currentStreak}</p>
                  </div>
                </div>
              </div>
            )}
            <BadgesDisplay userData={userData} variant="dashboard" />
            <PlanBadge plan={userData.plan} className="px-3" />
          </div>
        </div>
      </div>

      <div
        className="space-y-4"
        onPointerDown={handleHeroPointerDown}
        onPointerUp={handleHeroPointerEnd}
        onPointerCancel={() => {
          heroGestureStartRef.current = null;
        }}
        style={{ touchAction: "pan-y" }}
      >
          <div className="relative min-h-[212px] sm:min-h-[220px]">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={activeHeroAccount.id}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        x: heroAnimationDirection > 0 ? 56 : -56,
                        rotateZ: heroAnimationDirection > 0 ? 2 : -2,
                        scale: 0.985,
                      }
                }
                animate={{ opacity: 1, x: 0, rotateZ: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        x: heroAnimationDirection > 0 ? -56 : 56,
                        rotateZ: heroAnimationDirection > 0 ? -2 : 2,
                        scale: 0.985,
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.16 }
                    : {
                        duration: 0.26,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
                className="absolute inset-0"
              >
                <AccountSurfaceCard
                  account={heroCardAccount}
                  currencySettings={userData.currencySettings}
                  brandLabel={heroBrandLabel}
                  brandSubLabel={heroBrandSubLabel}
                  accountValue={heroAccountValue}
                  forceChip={heroIsMainCard}
                  className="hero-card border-0"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleHeroPrimaryAction} size="lg" variant="secondary" className="w-full border border-slate-200 bg-white text-slate-950 shadow-sm hover:bg-slate-50">
              <Plus className="mr-1 h-4 w-4" />
              {heroPrimaryLabel}
            </Button>
            <Button
              onClick={() => setShowAddExpense(true)}
              size="lg"
              variant="secondary"
              className="w-full bg-slate-950 text-white hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white/12 dark:text-white dark:hover:bg-white/16 dark:disabled:bg-white/8 dark:disabled:text-white/45"
              disabled={!heroAllowsExpense}
            >
              <TrendingDown className="mr-1 h-4 w-4" />
              {heroAllowsExpense ? "Add Expense" : "Expense Off"}
            </Button>
          </div>
      </div>

      {showThresholdAlert && !dismissedDashboardWarnings.has(DASHBOARD_WARNING_IDS.threshold) && (
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
            onClick={() => dismissDashboardWarning(DASHBOARD_WARNING_IDS.threshold)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {!budgetMetrics.todayExcluded && budgetMetrics.overspentToday && !dismissedDashboardWarnings.has(DASHBOARD_WARNING_IDS.overspent) && (
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
            onClick={() => dismissDashboardWarning(DASHBOARD_WARNING_IDS.overspent)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {budgetMetrics.daysRemaining !== Infinity &&
        budgetMetrics.daysRemaining < 30 &&
        userData.balance > 0 &&
        !dismissedDashboardWarnings.has(DASHBOARD_WARNING_IDS.sustain) && (
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
              onClick={() => dismissDashboardWarning(DASHBOARD_WARNING_IDS.sustain)}
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

      {plusAccess ? (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="muted-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tracked Accounts</p>
                <p className="mt-2 text-lg font-semibold">{advancedSummaryMetrics.trackedAccounts}</p>
              </div>
              <div className="muted-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Custom Wallets</p>
                <p className="mt-2 text-lg font-semibold">{advancedSummaryMetrics.walletCount}</p>
              </div>
              <div className="muted-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Monthly Subscriptions</p>
                <p className="mt-2 text-lg font-semibold">{formatUserCurrency(monthlySubscriptionTotal, userData.currencySettings)}</p>
              </div>
              <div className="muted-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Heatmap Access</p>
                <p className="mt-2 text-lg font-semibold">{proAccess ? "ExPro" : "Upgrade"}</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/82 px-4 py-4">
              <div>
                <p className="app-list-title">Richer overview</p>
                <p className="app-list-meta">
                  Total Balance mode respects account visibility and include-in-total controls, while subscription totals and the ExPro heatmap extend the analytics surface without changing the base dashboard flow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <LockedFeatureCard
          title="Advanced Summaries"
          description="Unlock richer balance views, subscription totals, and premium analytics surfaces with ExPlus."
          planLabel="ExPlus"
        />
      )}

      <SpendingHeatmapCalendar
        expenses={allExpenses}
        currencySettings={userData.currencySettings}
        plan={userData.plan}
        onOpenPremium={onOpenPremium}
      />

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
              {recentExpenses.map((expense, index) => {
                const expenseExcluded = isDateExempt(new Date(expense.date), userData.computationExemptions);

                return (
                  <div key={`${expense.id}-${expense.date}-${index}`} className="app-list-row flex items-center justify-between gap-3 bg-card">
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
        onAddMoney={handleHeroAddMoney}
        currencyCode={userData.currencySettings.preferredCurrency}
        accountLabel={activeHeroAccount.name}
        title={activeHeroAccount.balanceModel === "credit" ? "Pay Card" : "Add Money"}
        description={activeHeroAccount.balanceModel === "credit" ? `Reduce the outstanding amount on ${activeHeroAccount.name}.` : `Add funds to ${activeHeroAccount.name}.`}
        submitLabel={activeHeroAccount.balanceModel === "credit" ? "Pay Card" : "Add Money"}
        showBudgetPeriod={false}
      />

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onAddExpense={handleHeroAddExpense}
        currentBalance={activeHeroAccount.balanceModel === "credit" ? Math.max(activeHeroAccount.creditLimit - activeHeroAccount.usedCredit, 0) : activeHeroAccount.balance}
        customCategories={userData.customCategories || []}
        onManageCategories={() => setShowManageCategories(true)}
        currencySettings={userData.currencySettings}
        accountLabel={activeHeroAccount.name}
        description={activeHeroAccount.balanceModel === "credit" ? `Record a charge made using ${activeHeroAccount.name}.` : `Record a new expense for ${activeHeroAccount.name}.`}
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
