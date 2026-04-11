import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Calendar,
  ChevronDown,
  History as HistoryIcon,
  PiggyBank,
  Search,
  SlidersHorizontal,
  TrendingDown,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Transaction, UserData } from "../App";
import { collectAllTransactions } from "../utils/accounts";
import { filterTransactionsForAnalysis, isDateExempt, sortByDateDescending, startOfDay, startOfMonth, startOfWeek } from "../utils/finance";
import { formatUserCurrency } from "../utils/currency";
import { createDefaultUserData, getUserData, subscribeToUserData } from "../utils/userData";
import { FilterChipGroup } from "./FilterChipGroup";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type ExpenseHistoryProps = {
  username: string;
};

function formatHistorySummaryAmount(amount: number, currencySettings: UserData["currencySettings"]) {
  const absoluteAmount = Math.abs(amount);
  const sign = amount >= 0 ? "+" : "-";
  const currencySymbol = formatUserCurrency(0, currencySettings).replace(/[0-9.,\s]/g, "") || currencySettings.baseCurrency;

  if (absoluteAmount >= 1_000_000) {
    const compactMillions = absoluteAmount >= 10_000_000
      ? Math.round(absoluteAmount / 1_000_000).toString()
      : (absoluteAmount / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${currencySymbol}${compactMillions}M`;
  }

  if (absoluteAmount >= 100_000) {
    return `${sign}${formatUserCurrency(absoluteAmount, currencySettings).replace(/\.00$/, "")}`;
  }

  return `${sign}${formatUserCurrency(absoluteAmount, currencySettings)}`;
}

const transactionTypeInfo = {
  expense: {
    label: "Expense",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    sign: "-",
  },
  add_money: {
    label: "Add Money",
    icon: ArrowUpCircle,
    color: "text-green-600 dark:text-green-400",
    sign: "+",
  },
  add_savings: {
    label: "Add to Savings",
    icon: PiggyBank,
    color: "text-blue-600 dark:text-blue-400",
    sign: "-",
  },
  withdraw_savings: {
    label: "Withdraw Savings",
    icon: ArrowDownCircle,
    color: "text-orange-600 dark:text-orange-400",
    sign: "+",
  },
  transfer_in: {
    label: "Transfer In",
    icon: ArrowDownCircle,
    color: "text-sky-600 dark:text-sky-400",
    sign: "+",
  },
  transfer_out: {
    label: "Transfer Out",
    icon: ArrowLeftRight,
    color: "text-violet-600 dark:text-violet-400",
    sign: "-",
  },
  credit_payment: {
    label: "Credit Card Payment",
    icon: ArrowLeftRight,
    color: "text-emerald-600 dark:text-emerald-400",
    sign: "-",
  },
} satisfies Record<Transaction["type"], {
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

function getTransactionTitle(transaction: Transaction) {
  if (transaction.description?.trim()) {
    return transaction.description.trim();
  }

  switch (transaction.type) {
    case "expense":
      return transaction.category ? `${formatDisplayLabel(transaction.category)} Expense` : "Expense";
    case "add_money":
      return "Money Added";
    case "add_savings":
      return "Moved To Savings";
    case "withdraw_savings":
      return "Savings Withdrawal";
    case "transfer_in":
      return transaction.destinationName || transaction.description || "Transfer In";
    case "transfer_out":
      return transaction.destinationName ? `Transfer to ${transaction.destinationName}` : "Transfer Out";
    case "credit_payment":
      return transaction.destinationName ? `Card payment to ${transaction.destinationName}` : "Credit Card Payment";
  }
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
  { value: "add_savings", label: "To Savings" },
  { value: "withdraw_savings", label: "Withdraw" },
  { value: "transfer_out", label: "Transfer Out" },
  { value: "transfer_in", label: "Transfer In" },
  { value: "credit_payment", label: "Card Payment" },
];

export function ExpenseHistory({ username }: ExpenseHistoryProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const currentUserData = getUserData(username) ?? createDefaultUserData(username);
    setUserData(currentUserData);

    return subscribeToUserData(username, (nextUserData) => {
      setUserData(nextUserData);
    });
  }, [username]);

  const range = useMemo(() => getDateRange(filterPeriod), [filterPeriod]);

  const transactionsInPeriod = useMemo(() => {
    const sortedTransactions = sortByDateDescending(collectAllTransactions(userData));

    return sortedTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      if (range.start && transactionDate < range.start) return false;
      if (range.end && transactionDate > range.end) return false;
      return true;
    });
  }, [range.end, range.start, userData.transactions]);

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

    if (typeFilter in transactionTypeInfo) {
      return transactionsInPeriod.filter((transaction) => transaction.type === typeFilter);
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
        transactionTypeInfo[transaction.type].label,
        transaction.type.replaceAll("_", " "),
        ...dateTokens,
        isDateExempt(transaction.date, userData.computationExemptions) ? "exempted day" : "",
      ]
        .join(" ")
        .toLowerCase();

      return searchIndex.includes(normalizedQuery);
    });
  }, [deferredSearchQuery, typeFilteredTransactions, userData.computationExemptions]);

  const analysisTransactions = useMemo(
    () => filterTransactionsForAnalysis(filteredTransactions, userData.computationExemptions, range),
    [filteredTransactions, range, userData.computationExemptions],
  );

  const totalIncome = analysisTransactions
    .filter((transaction) => transaction.type === "add_money" || transaction.type === "withdraw_savings" || transaction.type === "transfer_in")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = analysisTransactions
    .filter((transaction) => transaction.type === "expense" || transaction.type === "add_savings" || transaction.type === "transfer_out" || transaction.type === "credit_payment")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const exemptTransactionCount = filteredTransactions.length - analysisTransactions.length;
  const netFlow = totalIncome - totalExpenses;
  const hasAdvancedFilters = typeFilter !== "all" || categoryFilter !== "all";
  const activeFilterSummary = (() => {
    if (typeFilter === "all") {
      return "All types";
    }

    if (typeFilter === "expense") {
      return categoryFilter === "all" ? "Expenses" : `Expenses • ${formatDisplayLabel(categoryFilter)}`;
    }

    return transactionTypeInfo[typeFilter as keyof typeof transactionTypeInfo]?.label ?? "Refined";
  })();

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">History</p>
          <h1 className="page-title flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Transaction History
          </h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-border/60 bg-muted/18">
            <div className="px-3 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Income</p>
              <p className="summary-amount mt-1 text-green-600 dark:text-green-400">
                {formatHistorySummaryAmount(totalIncome, userData.currencySettings)}
              </p>
            </div>
            <div className="border-x border-border/60 px-3 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Expenses</p>
              <p className="summary-amount mt-1 text-red-600 dark:text-red-400">
                {formatHistorySummaryAmount(-totalExpenses, userData.currencySettings)}
              </p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Net Flow</p>
              <p className={`summary-amount mt-1 ${netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatHistorySummaryAmount(netFlow, userData.currencySettings)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search transactions"
                className="pl-10 pr-10"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear history search"
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

          {exemptTransactionCount > 0 && (
            <div className="px-1 text-xs text-muted-foreground">
              {exemptTransactionCount} exempted transaction{exemptTransactionCount === 1 ? "" : "s"} left out of totals.
            </div>
          )}
        </CardContent>
      </Card>

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="app-empty-state space-y-3">
              <p className="text-sm text-muted-foreground">No transactions match this view.</p>
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
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((transaction, index) => {
            const typeInfo = transactionTypeInfo[transaction.type];
            const Icon = typeInfo.icon;
            const exempt = isDateExempt(transaction.date, userData.computationExemptions);
            const title = getTransactionTitle(transaction);
            const transactionDate = new Date(transaction.date);
            const metaItems = [
              typeInfo.label,
              transaction.type === "expense" && transaction.category ? formatDisplayLabel(transaction.category) : "",
              transaction.type === "add_savings" || transaction.type === "withdraw_savings" ? "Savings" : "",
              exempt ? "Exempted day" : "",
            ].filter(Boolean);

            const rowContent = (
              <div className="app-list-row bg-card">
                <div className="flex items-start gap-3">
                  <div className="app-list-icon">
                    <Icon className="h-[18px] w-[18px] text-muted-foreground" />
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

            return <div key={`${transaction.id}-${transaction.date}-${index}`}>{rowContent}</div>;
          })}
        </div>
      )}
    </div>
  );
}
