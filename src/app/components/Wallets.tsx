import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingDown,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ActiveAccount, BudgetPeriod, Expense, Transaction, UserData } from "../App";
import {
  calculateBudgetMetrics,
  filterExpensesForAnalysis,
  filterTransactionsForAnalysis,
  isDateExempt,
  sortByDateDescending,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../utils/finance";
import { checkAndAllocateBudget } from "../utils/budget";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";
import {
  createDefaultUserData,
  getActiveWallets,
  getUserData,
  resolveActiveAccount,
  saveUserData,
  subscribeToUserData,
  updateUserData,
} from "../utils/userData";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { AddMoneyDialog } from "./AddMoneyDialog";
import { ExpenseChart } from "./ExpenseChart";
import { FilterChipGroup } from "./FilterChipGroup";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { UndoNotification } from "./UndoNotification";
import { WalletManagerDialog } from "./WalletManagerDialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type WalletsProps = {
  username: string;
  activeAccount: ActiveAccount;
  onActiveAccountChange: (activeAccount: ActiveAccount) => void;
};

const transactionTypeInfo = {
  expense: {
    label: "Expense",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    sign: "-",
  },
  add_money: {
    label: "Add Money",
    icon: Wallet,
    color: "text-green-600 dark:text-green-400",
    sign: "+",
  },
} satisfies Record<"expense" | "add_money", {
  label: string;
  icon: LucideIcon;
  color: string;
  sign: string;
}>;

function getDateRange(filterPeriod: string) {
  const now = new Date();

  switch (filterPeriod) {
    case "today":
      return { start: startOfDay(now), end: new Date() };
    case "week":
      return { start: startOfWeek(now), end: new Date() };
    case "month":
      return { start: startOfMonth(now), end: new Date() };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date() };
    default:
      return {};
  }
}

function formatDisplayLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getWalletTransactionTitle(transaction: Transaction) {
  if (transaction.description?.trim()) {
    return transaction.description.trim();
  }

  if (transaction.type === "expense") {
    return transaction.category ? `${formatDisplayLabel(transaction.category)} Expense` : "Expense";
  }

  return "Money Added";
}

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "add_money", label: "Add Money" },
];

export function Wallets({ username, activeAccount, onActiveAccountChange }: WalletsProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [showThresholdAlert, setShowThresholdAlert] = useState(false);
  const [dismissedThresholdAlert, setDismissedThresholdAlert] = useState(false);
  const [dismissedOverspentAlert, setDismissedOverspentAlert] = useState(false);
  const [dismissedSustainAlert, setDismissedSustainAlert] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    message: string;
    previousUserData: UserData;
  } | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

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

  const activeWallets = useMemo(() => getActiveWallets(userData), [userData]);

  useEffect(() => {
    if (activeWallets.length === 0) {
      if (activeAccount.kind === "wallet") {
        onActiveAccountChange({ kind: "main" });
      }
      return;
    }

    const activeWalletExists =
      activeAccount.kind === "wallet" &&
      activeWallets.some((wallet) => wallet.id === activeAccount.walletId);

    if (!activeWalletExists) {
      onActiveAccountChange({ kind: "wallet", walletId: activeWallets[0].id });
    }
  }, [activeAccount, activeWallets, onActiveAccountChange]);

  const currentWallet = useMemo(() => {
    if (activeAccount.kind !== "wallet") {
      return null;
    }

    const resolvedAccount = resolveActiveAccount(userData, activeAccount);
    return resolvedAccount.kind === "wallet" ? resolvedAccount : null;
  }, [activeAccount, userData]);

  const budgetMetrics = useMemo(
    () => (currentWallet ? calculateBudgetMetrics(currentWallet, userData.computationExemptions) : null),
    [currentWallet, userData.computationExemptions],
  );

  const analysisExpenses = useMemo(
    () => (currentWallet ? filterExpensesForAnalysis(currentWallet.expenses, userData.computationExemptions) : []),
    [currentWallet, userData.computationExemptions],
  );

  const thresholdAmount = currentWallet
    ? (currentWallet.thresholdPercentage / 100) * currentWallet.initialBalance
    : 0;

  useEffect(() => {
    if (!currentWallet || currentWallet.initialBalance <= 0) {
      setShowThresholdAlert(false);
      return;
    }

    setShowThresholdAlert(currentWallet.balance <= thresholdAmount && currentWallet.balance > 0);
  }, [currentWallet, thresholdAmount]);

  const range = useMemo(() => getDateRange(filterPeriod), [filterPeriod]);

  const transactionsInPeriod = useMemo(() => {
    if (!currentWallet) return [];

    const sortedTransactions = sortByDateDescending(currentWallet.transactions);

    return sortedTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      if (range.start && transactionDate < range.start) return false;
      if (range.end && transactionDate > range.end) return false;
      return true;
    });
  }, [currentWallet, range.end, range.start]);

  const typeFilteredTransactions = useMemo(() => {
    if (typeFilter === "all") {
      return transactionsInPeriod;
    }

    if (typeFilter === "expense") {
      return transactionsInPeriod.filter((transaction) => {
        if (transaction.type !== "expense") return false;
        if (categoryFilter === "all") return true;
        return transaction.category?.toLowerCase() === categoryFilter.toLowerCase();
      });
    }

    if (typeFilter === "add_money") {
      return transactionsInPeriod.filter((transaction) => transaction.type === "add_money");
    }

    return transactionsInPeriod;
  }, [categoryFilter, transactionsInPeriod, typeFilter]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return typeFilteredTransactions;
    }

    return typeFilteredTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const dateTokens = [
        transaction.date,
        transactionDate.toLocaleDateString(),
        transactionDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        transactionDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        transactionDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      ];

      const searchIndex = [
        transaction.description ?? "",
        transaction.category ?? "",
        transactionTypeInfo[transaction.type === "expense" ? "expense" : "add_money"].label,
        transaction.type.replaceAll("_", " "),
        currentWallet.name,
        ...dateTokens,
        isDateExempt(transaction.date, userData.computationExemptions) ? "exempted day" : "",
      ]
        .join(" ")
        .toLowerCase();

      return searchIndex.includes(normalizedQuery);
    });
  }, [currentWallet?.name, deferredSearchQuery, typeFilteredTransactions, userData.computationExemptions]);

  const analysisTransactions = useMemo(
    () => filterTransactionsForAnalysis(filteredTransactions, userData.computationExemptions, range),
    [filteredTransactions, range, userData.computationExemptions],
  );

  const totalIncome = analysisTransactions
    .filter((transaction) => transaction.type === "add_money")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = analysisTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const exemptTransactionCount = filteredTransactions.length - analysisTransactions.length;
  const hasAdvancedFilters = typeFilter !== "all" || categoryFilter !== "all";
  const activeFilterSummary = (() => {
    if (typeFilter === "all") {
      return "All types";
    }

    if (typeFilter === "expense") {
      return categoryFilter === "all" ? "Expenses" : `Expenses • ${formatDisplayLabel(categoryFilter)}`;
    }

    return transactionTypeInfo.add_money.label;
  })();

  const persistCurrentWallet = (updater: (currentUserData: UserData) => UserData, message?: string) => {
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

  const handleAddMoney = (amount: number, period: BudgetPeriod) => {
    if (!currentWallet) return;

    const amountInBaseCurrency = convertToBaseCurrency(amount, userData.currencySettings);
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "add_money",
      amount: amountInBaseCurrency,
      date: new Date().toISOString(),
    };

    persistCurrentWallet(
      (currentUserData) => ({
        ...currentUserData,
        wallets: currentUserData.wallets.map((wallet) =>
          wallet.id === currentWallet.id
            ? {
                ...wallet,
                balance: wallet.balance + amountInBaseCurrency,
                initialBalance: wallet.initialBalance + amountInBaseCurrency,
                budgetPeriod: period,
                transactions: [transaction, ...wallet.transactions],
                updatedAt: new Date().toISOString(),
              }
            : wallet,
        ),
      }),
      `Added ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} to ${currentWallet.name}`,
    );

    setShowAddMoney(false);
  };

  const handleAddExpense = (expense: Omit<Expense, "id" | "date">) => {
    if (!currentWallet) return;

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

    persistCurrentWallet(
      (currentUserData) => ({
        ...currentUserData,
        wallets: currentUserData.wallets.map((wallet) =>
          wallet.id === currentWallet.id
            ? {
                ...wallet,
                balance: wallet.balance - amountInBaseCurrency,
                expenses: [newExpense, ...wallet.expenses],
                transactions: [transaction, ...wallet.transactions],
                updatedAt: new Date().toISOString(),
              }
            : wallet,
        ),
      }),
      `Added expense: ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} in ${currentWallet.name}`,
    );

    setShowAddExpense(false);
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

  if (activeWallets.length === 0) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wallets</p>
            <h1 className="page-title flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Wallets
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="app-empty-state space-y-4">
            <Wallet className="mx-auto h-10 w-10 text-primary" />
              <div>
                <p className="font-medium">No custom wallets yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Create one for a trip, goal, or dedicated fund.</p>
              </div>
              <Button onClick={() => setShowWalletManager(true)}>Create Wallet</Button>
            </div>
          </CardContent>
        </Card>

        <WalletManagerDialog
          open={showWalletManager}
          onOpenChange={setShowWalletManager}
          wallets={userData.wallets}
          onChange={(nextWallets) =>
            updateUserData(username, (currentUserData) => ({
              ...currentUserData,
              wallets: nextWallets,
            }))
          }
          onOpenWallet={(walletId) => {
            onActiveAccountChange({ kind: "wallet", walletId });
            setShowWalletManager(false);
          }}
          currencySettings={userData.currencySettings}
        />
      </div>
    );
  }

  if (!currentWallet || !budgetMetrics) {
    return null;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wallets</p>
          <h1 className="page-title flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Wallets
          </h1>
        </div>
      </div>

      <Card className="hero-card border-0">
        <CardContent className="relative space-y-5 overflow-hidden pt-5">
          <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-primary-foreground/72">Selected wallet balance</p>
              <p className="mt-2 text-[2.45rem] font-semibold tracking-[-0.05em] text-primary-foreground">
                {formatUserCurrency(currentWallet.balance, userData.currencySettings)}
              </p>
            </div>
            <div className="rounded-full border border-white/12 bg-white/10 px-3 py-2 text-sm font-medium text-primary-foreground">
              {currentWallet.name}
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Selected wallet</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">{currentWallet.name}</p>
            </div>
            <div className="flex gap-2">
              <Select
                value={currentWallet.id}
                onValueChange={(walletId) => onActiveAccountChange({ kind: "wallet", walletId })}
              >
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeWallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowWalletManager(true)} className="shrink-0">
                Manage
              </Button>
            </div>
          </div>
          <p className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Separate from your main balance and savings.
          </p>
        </CardContent>
      </Card>

      {showThresholdAlert && !dismissedThresholdAlert && (
        <Alert className="relative border-orange-500 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="pr-8 text-orange-800 dark:text-orange-200">
            {currentWallet.name} is below {currentWallet.thresholdPercentage}% of its tracked amount (
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
            {currentWallet.name} overspent today. Spent{" "}
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
        currentWallet.balance > 0 &&
        !dismissedSustainAlert && (
          <Alert className="relative border-yellow-500 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="pr-8 text-yellow-800 dark:text-yellow-200">
              {budgetMetrics.daysRemaining < 1
                ? `${currentWallet.name} will not last another active day at the current non-exempt spending rate.`
                : `${currentWallet.name} can sustain for about ${budgetMetrics.daysRemaining} more active day${budgetMetrics.daysRemaining === 1 ? "" : "s"} at the current non-exempt spending rate.`}
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
          <CardTitle>Wallet Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentWallet.autoBudgetEnabled ? (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="muted-tile py-3 text-center">
                <Calendar className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="mb-1 text-xs text-muted-foreground">Per Day</p>
                <p className="text-sm">{formatUserCurrency(budgetMetrics.dailyBudget, userData.currencySettings)}</p>
              </div>
              <div className="muted-tile py-3 text-center">
                <CalendarDays className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="mb-1 text-xs text-muted-foreground">Per Week</p>
                <p className="text-sm">{formatUserCurrency(budgetMetrics.weeklyBudget, userData.currencySettings)}</p>
              </div>
              <div className="muted-tile py-3 text-center">
                <CalendarRange className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="mb-1 text-xs text-muted-foreground">Per Month</p>
                <p className="text-sm">{formatUserCurrency(budgetMetrics.monthlyBudget, userData.currencySettings)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Auto budget is off for {currentWallet.name}. Turn it on in Settings to show daily, weekly, and monthly wallet guidance here.
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseChart expenses={analysisExpenses} currencySettings={userData.currencySettings} />

      <Card>
        <CardHeader>
          <CardTitle>Wallet History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="muted-tile py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Income</p>
              <p className="summary-amount mt-1.5 text-green-600 dark:text-green-400">
                +{formatUserCurrency(totalIncome, userData.currencySettings)}
              </p>
            </div>
            <div className="muted-tile py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Expenses</p>
              <p className="summary-amount mt-1.5 text-red-600 dark:text-red-400">
                -{formatUserCurrency(totalExpenses, userData.currencySettings)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search wallet transactions"
                  className="pl-10 pr-10"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear wallet history search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-xs text-muted-foreground">Search by name, tag, date, or note.</p>
                {(searchQuery.trim() || filterPeriod !== "all" || hasAdvancedFilters) && (
                  <p className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {filteredTransactions.length} result{filteredTransactions.length === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <FilterChipGroup options={PERIOD_OPTIONS} value={filterPeriod} onChange={setFilterPeriod} />

              <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/22">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/60 bg-background/80">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.02em]">Refine Results</p>
                        <p className="text-xs text-muted-foreground">{activeFilterSummary}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-3 border-t border-border/60 px-3.5 pb-3.5 pt-3">
                    <FilterChipGroup options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />

                    {typeFilter === "expense" && (
                      <div className="rounded-2xl border border-border/60 bg-background/88 p-3">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="border-0 bg-transparent px-0 shadow-none">
                            <SelectValue placeholder="All expense categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All expense categories</SelectItem>
                            <SelectItem value="leisure">Leisure</SelectItem>
                            <SelectItem value="bills">Bills</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            {userData.customCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>

          {exemptTransactionCount > 0 && (
            <div className="px-1 text-xs text-muted-foreground">
              {exemptTransactionCount} exempted wallet transaction{exemptTransactionCount === 1 ? "" : "s"} left out of totals.
            </div>
          )}

          {filteredTransactions.length === 0 ? (
            <div className="app-empty-state space-y-3">
              <p className="text-sm text-muted-foreground">No wallet transactions match this view.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterPeriod("all");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                  setShowAdvancedFilters(false);
                }}
              >
                Clear Search & Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((transaction) => {
                const typeInfo = transaction.type === "expense" ? transactionTypeInfo.expense : transactionTypeInfo.add_money;
                const Icon = typeInfo.icon;
                const exempt = isDateExempt(transaction.date, userData.computationExemptions);
                const title = getWalletTransactionTitle(transaction);
                const transactionDate = new Date(transaction.date);
                const metaItems = [
                  typeInfo.label,
                  transaction.type === "expense" && transaction.category ? formatDisplayLabel(transaction.category) : "",
                  exempt ? "Exempted day" : "",
                ].filter(Boolean);

                return (
                  <div key={transaction.id} className="app-list-row">
                    <div className="flex items-start gap-3">
                      <div className="app-list-icon">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="app-list-title truncate">{title}</p>
                            <div className="app-list-meta flex flex-wrap items-center gap-x-1.5 gap-y-1">
                              {metaItems.map((item, index) => (
                                <span key={`${transaction.id}-${item}`} className="flex items-center gap-1.5">
                                  {index > 0 && <span className="text-border">•</span>}
                                  <span>{item}</span>
                                </span>
                              ))}
                            </div>
                            <div className="app-list-meta flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{transactionDate.toLocaleDateString()}</span>
                              <span>•</span>
                              <span>
                                {transactionDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={`summary-amount text-base ${typeInfo.color}`}>
                              {typeInfo.sign}
                              {formatUserCurrency(transaction.amount, userData.currencySettings)}
                            </p>
                          </div>
                        </div>
                      </div>
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
        accountLabel={currentWallet.name}
      />

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onAddExpense={handleAddExpense}
        currentBalance={currentWallet.balance}
        customCategories={userData.customCategories}
        onManageCategories={() => setShowManageCategories(true)}
        currencySettings={userData.currencySettings}
        accountLabel={currentWallet.name}
      />

      <ManageCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
        customCategories={userData.customCategories}
        onUpdateCategories={handleUpdateCategories}
      />

      <WalletManagerDialog
        open={showWalletManager}
        onOpenChange={setShowWalletManager}
        wallets={userData.wallets}
        onChange={(nextWallets) =>
          updateUserData(username, (currentUserData) => ({
            ...currentUserData,
            wallets: nextWallets,
          }))
        }
        onOpenWallet={(walletId) => {
          onActiveAccountChange({ kind: "wallet", walletId });
          setShowWalletManager(false);
        }}
        currencySettings={userData.currencySettings}
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
