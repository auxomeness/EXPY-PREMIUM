import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, TrendingDown, Wallet, AlertCircle, Calendar, CalendarDays, CalendarRange, AlertTriangle, X, Flame } from "lucide-react";
import { AddMoneyDialog } from "./AddMoneyDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { ExpenseChart } from "./ExpenseChart";
import { BadgesDisplay } from "./BadgesDisplay";
import { UndoNotification } from "./UndoNotification";
import type { UserData, Expense, Transaction } from "../App";
import { Alert, AlertDescription } from "./ui/alert";
import { formatCurrency } from "../utils/currency";
import { checkAndAllocateBudget } from "../utils/budget";
import { checkAndSendDailyNotification } from "../utils/notifications";
import { AnimatePresence } from "motion/react";

type DashboardProps = {
  username: string;
};

export function Dashboard({ username }: DashboardProps) {
  const [userData, setUserData] = useState<UserData>({
    username,
    balance: 0,
    initialBalance: 0,
    expenses: [],
    transactions: [],
    thresholdPercentage: 20,
    customCategories: [],
    budgetPeriod: "monthly",
    budgetAmount: 0,
    lastBudgetReset: new Date().toISOString(),
    currentStreak: 0,
    lastOpenedDate: new Date().toISOString(),
    savings: 0,
    savingsLocked: false,
    notificationsEnabled: false,
    dayEndTime: "22:00",
    lastNotificationDate: "",
    securityQuestions: {
      nickname: "",
      birthdate: "",
      favoriteColor: "",
      secretCode: "",
    },
  });
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showThresholdAlert, setShowThresholdAlert] = useState(false);
  const [dismissedThresholdAlert, setDismissedThresholdAlert] = useState(false);
  const [dismissedOverspentAlert, setDismissedOverspentAlert] = useState(false);
  const [dismissedSustainAlert, setDismissedSustainAlert] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [undoAction, setUndoAction] = useState<{
    type: "addMoney" | "addExpense";
    message: string;
    previousData: Partial<UserData>;
  } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [username]);

  useEffect(() => {
    // Check for daily notifications whenever userData changes
    checkAndSendDailyNotification(userData);
  }, [userData]);

  useEffect(() => {
    checkThreshold();
  }, [userData.balance, userData.initialBalance, userData.thresholdPercentage]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    if (users[username]) {
      let data = { username, ...users[username] };
      
      // Load display name
      setDisplayName(data.displayName || "");
      
      // Check if we need to allocate new budget for a new period
      data = checkAndAllocateBudget(data);
      
      // Save back if budget was allocated
      if (data.balance !== users[username].balance) {
        users[username] = data;
        localStorage.setItem("expy_users", JSON.stringify(users));
      }
      
      setUserData(data);
    }
  };

  const saveUserData = (data: Partial<UserData>) => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username] = { ...users[username], ...data };
    localStorage.setItem("expy_users", JSON.stringify(users));
    loadUserData();
  };

  const checkThreshold = () => {
    if (userData.initialBalance > 0) {
      const thresholdAmount = (userData.thresholdPercentage / 100) * userData.initialBalance;
      setShowThresholdAlert(userData.balance <= thresholdAmount && userData.balance > 0);
    }
  };

  const handleAddMoney = (amount: number, period: import("../App").BudgetPeriod) => {
    // Save previous state for undo
    const previousData = {
      balance: userData.balance,
      initialBalance: userData.initialBalance,
      budgetPeriod: userData.budgetPeriod,
      transactions: userData.transactions || [],
    };
    
    // Create transaction record
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "add_money",
      amount: amount,
      date: new Date().toISOString(),
    };
    
    const newBalance = userData.balance + amount;
    const newInitialBalance = userData.initialBalance + amount;
    const newTransactions = [transaction, ...(userData.transactions || [])];
    
    saveUserData({ 
      balance: newBalance, 
      initialBalance: newInitialBalance, 
      budgetPeriod: period,
      transactions: newTransactions,
    });
    setShowAddMoney(false);
    
    // Show undo notification
    setUndoAction({
      type: "addMoney",
      message: `Added ${formatCurrency(amount)} to balance`,
      previousData,
    });
  };

  const handleAddExpense = (expense: Omit<Expense, "id" | "date">) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    
    // Create transaction record
    const transaction: Transaction = {
      id: newExpense.id,
      type: "expense",
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: newExpense.date,
    };
    
    // Save previous state for undo
    const previousData = {
      balance: userData.balance,
      expenses: userData.expenses,
      transactions: userData.transactions || [],
    };
    
    const newBalance = userData.balance - expense.amount;
    const newExpenses = [newExpense, ...userData.expenses];
    const newTransactions = [transaction, ...(userData.transactions || [])];
    
    saveUserData({ 
      balance: newBalance, 
      expenses: newExpenses,
      transactions: newTransactions,
    });
    
    // Show undo notification
    setUndoAction({
      type: "addExpense",
      message: `Added expense: ${formatCurrency(expense.amount)}`,
      previousData,
    });
  };

  const handleUndo = () => {
    if (undoAction) {
      saveUserData(undoAction.previousData);
      setUndoAction(null);
    }
  };

  const handleUndoComplete = () => {
    setUndoAction(null);
  };

  const handleUpdateCategories = (categories: string[]) => {
    saveUserData({ customCategories: categories });
  };

  const recentExpenses = userData.expenses.slice(0, 3);
  
  // Calculate spending allowances based on budget period
  // Only show budgets for periods equal to or shorter than the budget period
  let dailyBudget: number;
  let weeklyBudget: number;
  let monthlyBudget: number;

  const budgetPeriod = userData.budgetPeriod || "monthly";
  
  if (budgetPeriod === "daily") {
    // Balance is for one day only
    dailyBudget = userData.balance;
    weeklyBudget = 0; // Can't project daily balance to weekly
    monthlyBudget = 0; // Can't project daily balance to monthly
  } else if (budgetPeriod === "weekly") {
    // Balance is for one week
    dailyBudget = userData.balance / 7; // Break down weekly to daily
    weeklyBudget = userData.balance;
    monthlyBudget = 0; // Can't project weekly balance to monthly
  } else { // monthly
    // Balance is for one month
    dailyBudget = userData.balance / 30;
    weeklyBudget = userData.balance / 4.29; // ~30/7
    monthlyBudget = userData.balance;
  }

  // Calculate today's spending
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayExpenses = userData.expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    expenseDate.setHours(0, 0, 0, 0);
    return expenseDate.getTime() === today.getTime();
  });
  const todaySpent = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate average daily spending (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentExpenses7Days = userData.expenses.filter(expense => 
    new Date(expense.date) >= sevenDaysAgo
  );
  const totalSpentLast7Days = recentExpenses7Days.reduce((sum, expense) => sum + expense.amount, 0);
  const averageDailySpending = recentExpenses7Days.length > 0 ? totalSpentLast7Days / 7 : 0;

  // Calculate sustainability
  const daysRemaining = averageDailySpending > 0 ? Math.floor(userData.balance / averageDailySpending) : Infinity;
  const weeksRemaining = daysRemaining / 7;
  const monthsRemaining = daysRemaining / 30;

  // Check if overspent today
  const overspentToday = todaySpent > dailyBudget;

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 flex items-center justify-between">
        <h1>Welcome back, {displayName || username}!</h1>
        <div className="flex items-center gap-2">
          {userData.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{userData.currentStreak}</span>
            </div>
          )}
          <BadgesDisplay userData={userData} />
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary/80">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-primary-foreground/80 text-sm">Current Balance</p>
            <Wallet className="w-5 h-5 text-primary-foreground/80" />
          </div>
          <p className="text-4xl text-primary-foreground mb-4">{formatCurrency(userData.balance)}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setShowAddMoney(true)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Money
            </Button>
            <Button
              onClick={() => setShowAddExpense(true)}
              variant="outline"
              size="sm"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <TrendingDown className="w-4 h-4 mr-1" />
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {showThresholdAlert && !dismissedThresholdAlert && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 relative">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200 pr-8">
            Your balance is below {userData.thresholdPercentage}% of your initial amount ({formatCurrency((userData.thresholdPercentage / 100 * userData.initialBalance))})
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900"
            onClick={() => setDismissedThresholdAlert(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {overspentToday && !dismissedOverspentAlert && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-900 relative">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200 pr-8">
            You've overspent today! Spent {formatCurrency(todaySpent)} out of your daily budget of {formatCurrency(dailyBudget)}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
            onClick={() => setDismissedOverspentAlert(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {daysRemaining !== Infinity && daysRemaining < 30 && userData.balance > 0 && !dismissedSustainAlert && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900 relative">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200 pr-8">
            {daysRemaining < 1 ? (
              "⚠️ At your current spending rate, your balance won't last another day!"
            ) : daysRemaining < 7 ? (
              `⚠️ At your current spending rate, you can sustain for ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''}.`
            ) : daysRemaining < 30 ? (
              `At your current spending rate, you can sustain for ${Math.floor(weeksRemaining)} week${Math.floor(weeksRemaining) !== 1 ? 's' : ''} (${daysRemaining} days).`
            ) : null}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900"
            onClick={() => setDismissedSustainAlert(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Spending Budget</CardTitle>
          <CardDescription>How much you can spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Per Day</p>
              <p className="text-sm">{formatCurrency(dailyBudget)}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <CalendarDays className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Per Week</p>
              <p className="text-sm">{formatCurrency(weeklyBudget)}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <CalendarRange className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Per Month</p>
              <p className="text-sm">{formatCurrency(monthlyBudget)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Spending</CardTitle>
          <CardDescription>Your spending progress for today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Daily Budget</span>
            <span className="text-sm">{formatCurrency(dailyBudget)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Spent Today</span>
            <span className={`text-sm ${overspentToday ? 'text-red-600 dark:text-red-400' : ''}`}>
              {formatCurrency(todaySpent)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {todaySpent < dailyBudget ? 'Saved Today' : 'Overspent'}
            </span>
            <span className={`text-sm font-medium ${todaySpent < dailyBudget ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {todaySpent < dailyBudget ? '+' : ''}{formatCurrency(dailyBudget - todaySpent)}
            </span>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
              <div
                style={{ width: `${Math.min((todaySpent / dailyBudget) * 100, 100)}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  overspentToday ? 'bg-destructive' : 'bg-primary'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {todaySpent < dailyBudget 
              ? `Great job! You're under budget by ${formatCurrency(dailyBudget - todaySpent)}. This amount stays in your balance for future use.`
              : `You've exceeded your daily budget by ${formatCurrency(todaySpent - dailyBudget)}.`
            }
          </p>
        </CardContent>
      </Card>

      <ExpenseChart expenses={userData.expenses} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No expenses yet</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="capitalize">{expense.description || expense.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 dark:text-red-400">-{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddMoneyDialog
        open={showAddMoney}
        onOpenChange={setShowAddMoney}
        onAddMoney={handleAddMoney}
      />

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onAddExpense={handleAddExpense}
        currentBalance={userData.balance}
        customCategories={userData.customCategories || []}
        onManageCategories={() => setShowManageCategories(true)}
      />

      <ManageCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
        customCategories={userData.customCategories || []}
        onUpdateCategories={handleUpdateCategories}
      />

      <AnimatePresence>
        {undoAction && (
          <UndoNotification
            message={undoAction.message}
            onUndo={handleUndo}
            onComplete={handleUndoComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}