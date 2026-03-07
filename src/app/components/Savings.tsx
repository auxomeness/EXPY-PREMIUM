import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { PiggyBank, Plus, TrendingUp, Lock, Unlock } from "lucide-react";
import { AddSavingsDialog } from "./AddSavingsDialog";
import { WithdrawSavingsDialog } from "./WithdrawSavingsDialog";
import { UnlockSavingsDialog } from "./UnlockSavingsDialog";
import { UndoNotification } from "./UndoNotification";
import type { UserData, Transaction } from "../App";
import { formatCurrency } from "../utils/currency";
import { toast } from "sonner";
import { AnimatePresence } from "motion/react";

type SavingsProps = {
  username: string;
};

export function Savings({ username }: SavingsProps) {
  const [userData, setUserData] = useState<UserData>({
    username,
    balance: 0,
    initialBalance: 0,
    expenses: [],
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
    transactions: [],
  });
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [showWithdrawSavings, setShowWithdrawSavings] = useState(false);
  const [showUnlockSavings, setShowUnlockSavings] = useState(false);
  const [undoAction, setUndoAction] = useState<{
    type: "addSavings" | "withdrawSavings";
    message: string;
    previousData: Partial<UserData>;
  } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [username]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    if (users[username]) {
      setUserData({ username, ...users[username] });
    }
  };

  const saveUserData = (data: Partial<UserData>) => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username] = { ...users[username], ...data };
    localStorage.setItem("expy_users", JSON.stringify(users));
    loadUserData();
  };

  const handleAddSavings = (amount: number) => {
    // Save previous state for undo
    const previousData = {
      balance: userData.balance,
      savings: userData.savings,
      transactions: userData.transactions || [],
    };
    
    // Create transaction record
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "add_savings",
      amount: amount,
      date: new Date().toISOString(),
    };
    
    const newBalance = userData.balance - amount;
    const newSavings = (userData.savings || 0) + amount;
    const newTransactions = [transaction, ...(userData.transactions || [])];
    
    saveUserData({ 
      balance: newBalance, 
      savings: newSavings,
      transactions: newTransactions,
    });
    
    // Show undo notification
    setUndoAction({
      type: "addSavings",
      message: `Added ${formatCurrency(amount)} to savings`,
      previousData,
    });
  };

  const handleWithdrawSavings = (amount: number) => {
    // Save previous state for undo
    const previousData = {
      balance: userData.balance,
      savings: userData.savings,
      transactions: userData.transactions || [],
    };
    
    // Create transaction record
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "withdraw_savings",
      amount: amount,
      date: new Date().toISOString(),
    };
    
    const newSavings = (userData.savings || 0) - amount;
    const newBalance = userData.balance + amount;
    const newTransactions = [transaction, ...(userData.transactions || [])];
    
    saveUserData({ 
      savings: newSavings, 
      balance: newBalance,
      transactions: newTransactions,
    });
    
    // Show undo notification
    setUndoAction({
      type: "withdrawSavings",
      message: `Withdrew ${formatCurrency(amount)} from savings`,
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

  const handleToggleLock = () => {
    if (userData.savingsLocked) {
      // If locked, show unlock dialog
      setShowUnlockSavings(true);
    } else {
      // If unlocked, lock it directly
      saveUserData({ savingsLocked: true });
      toast.success("Savings locked successfully");
    }
  };

  const handleUnlock = (password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    const user = users[username];
    
    if (user && user.password === password) {
      saveUserData({ savingsLocked: false });
      toast.success("Savings unlocked successfully");
      return true;
    }
    
    return false;
  };

  const handleWithdrawClick = () => {
    if (userData.savingsLocked) {
      toast.error("Savings are locked. Please unlock first to withdraw.");
    } else {
      setShowWithdrawSavings(true);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="flex items-center gap-2">
          <PiggyBank className="w-6 h-6" />
          Savings
        </h1>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary/80">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-primary-foreground/80 text-sm">Total Savings</p>
            <div className="flex items-center gap-2">
              {userData.savingsLocked && (
                <Lock className="w-4 h-4 text-primary-foreground/80" />
              )}
              <PiggyBank className="w-5 h-5 text-primary-foreground/80" />
            </div>
          </div>
          <p className="text-4xl text-primary-foreground mb-4">
            {formatCurrency(userData.savings || 0)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setShowAddSavings(true)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Savings
            </Button>
            <Button
              onClick={handleWithdrawClick}
              variant="outline"
              size="sm"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              disabled={!userData.savings || userData.savings <= 0}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Protect your savings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleToggleLock}
            variant={userData.savingsLocked ? "destructive" : "default"}
            className="w-full"
          >
            {userData.savingsLocked ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Savings
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock Savings
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {userData.savingsLocked 
              ? "Your savings are locked. You need to enter your password to unlock and withdraw."
              : "Lock your savings to prevent accidental withdrawals. You'll need your password to unlock."
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Financial Overview</CardTitle>
          <CardDescription>Current balance and savings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="text-lg font-semibold">{formatCurrency(userData.balance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Savings</span>
              <span className="text-lg font-semibold">{formatCurrency(userData.savings || 0)}</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-semibold">Total Assets</span>
              <span className="text-xl font-bold">
                {formatCurrency(userData.balance + (userData.savings || 0))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Savings</CardTitle>
          <CardDescription>How your savings work</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span>•</span>
              <span>Transfer money from your balance to savings to set it aside</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Savings are kept separate from your spending balance</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Withdraw from savings back to your balance anytime you need</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Use savings to build an emergency fund or save for goals</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <AddSavingsDialog
        open={showAddSavings}
        onOpenChange={setShowAddSavings}
        onAddSavings={handleAddSavings}
        currentBalance={userData.balance}
      />

      <WithdrawSavingsDialog
        open={showWithdrawSavings}
        onOpenChange={setShowWithdrawSavings}
        onWithdraw={handleWithdrawSavings}
        currentSavings={userData.savings || 0}
      />

      <UnlockSavingsDialog
        open={showUnlockSavings}
        onOpenChange={setShowUnlockSavings}
        onUnlock={handleUnlock}
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