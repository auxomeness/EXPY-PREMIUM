import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Lock,
  Pencil,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import type { Transaction, UserData, WishlistItem } from "../App";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";
import { createDefaultUserData, generateEntityId, getUserData, saveUserData, subscribeToUserData, updateUserData } from "../utils/userData";
import { AddSavingsDialog } from "./AddSavingsDialog";
import { UnlockSavingsDialog } from "./UnlockSavingsDialog";
import { UndoNotification } from "./UndoNotification";
import { WithdrawSavingsDialog } from "./WithdrawSavingsDialog";
import { WishlistItemDialog } from "./WishlistItemDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

type SavingsProps = {
  username: string;
};

type UndoSnapshot = {
  message: string;
  previousUserData: UserData;
};

export function Savings({ username }: SavingsProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [showWithdrawSavings, setShowWithdrawSavings] = useState(false);
  const [showUnlockSavings, setShowUnlockSavings] = useState(false);
  const [showWishlistDialog, setShowWishlistDialog] = useState(false);
  const [editingWishlistItem, setEditingWishlistItem] = useState<WishlistItem | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);

  useEffect(() => {
    const currentUserData = getUserData(username) ?? createDefaultUserData(username);
    setUserData(currentUserData);

    return subscribeToUserData(username, (nextUserData) => {
      setUserData(nextUserData);
    });
  }, [username]);

  const sortedWishlist = useMemo(() => {
    return [...userData.savingsWishlist].sort((left, right) => {
      const leftRemaining = Math.max(left.targetCost - userData.savings, 0);
      const rightRemaining = Math.max(right.targetCost - userData.savings, 0);

      if (leftRemaining !== rightRemaining) {
        return leftRemaining - rightRemaining;
      }

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }, [userData.savings, userData.savingsWishlist]);
  const supportsPasswordLock = userData.authProvider !== "google";

  const persistWithUndo = (updater: (currentUserData: UserData) => UserData, message: string) => {
    const previousUserData = userData;
    const nextUserData = updateUserData(username, updater);

    if (!nextUserData) {
      toast.error("Unable to update savings right now");
      return;
    }

    setUndoSnapshot({
      message,
      previousUserData,
    });
  };

  const handleAddSavings = (amount: number) => {
    const amountInBaseCurrency = convertToBaseCurrency(amount, userData.currencySettings);
    const transaction: Transaction = {
      id: generateEntityId("savings"),
      type: "add_savings",
      amount: amountInBaseCurrency,
      date: new Date().toISOString(),
    };

    persistWithUndo(
      (currentUserData) => ({
        ...currentUserData,
        balance: currentUserData.balance - amountInBaseCurrency,
        savings: currentUserData.savings + amountInBaseCurrency,
        transactions: [transaction, ...currentUserData.transactions],
      }),
      `Moved ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} into savings`,
    );
  };

  const handleWithdrawSavings = (amount: number) => {
    const amountInBaseCurrency = convertToBaseCurrency(amount, userData.currencySettings);
    const transaction: Transaction = {
      id: generateEntityId("savings"),
      type: "withdraw_savings",
      amount: amountInBaseCurrency,
      date: new Date().toISOString(),
    };

    persistWithUndo(
      (currentUserData) => ({
        ...currentUserData,
        balance: currentUserData.balance + amountInBaseCurrency,
        savings: currentUserData.savings - amountInBaseCurrency,
        transactions: [transaction, ...currentUserData.transactions],
      }),
      `Moved ${formatUserCurrency(amountInBaseCurrency, userData.currencySettings)} back to main balance`,
    );
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;

    saveUserData(username, undoSnapshot.previousUserData);
    setUndoSnapshot(null);
  };

  const handleToggleLock = () => {
    if (!supportsPasswordLock) {
      toast.message("Savings lock is only available for password-based accounts right now.");
      return;
    }

    if (userData.savingsLocked) {
      setShowUnlockSavings(true);
      return;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      savingsLocked: true,
    }));
    toast.success("Savings locked successfully");
  };

  const handleUnlock = (password: string) => {
    const latestUserData = getUserData(username);

    if (!latestUserData || latestUserData.password !== password) {
      return false;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      savingsLocked: false,
    }));
    toast.success("Savings unlocked successfully");
    return true;
  };

  const handleWithdrawClick = () => {
    if (userData.savingsLocked) {
      toast.error("Savings are locked. Unlock first to withdraw.");
      return;
    }

    setShowWithdrawSavings(true);
  };

  const handleSaveWishlistItem = (item: WishlistItem) => {
    updateUserData(username, (currentUserData) => {
      const exists = currentUserData.savingsWishlist.some((wishlistItem) => wishlistItem.id === item.id);

      return {
        ...currentUserData,
        savingsWishlist: exists
          ? currentUserData.savingsWishlist.map((wishlistItem) => (wishlistItem.id === item.id ? item : wishlistItem))
          : [...currentUserData.savingsWishlist, item],
      };
    });

    setEditingWishlistItem(null);
    setShowWishlistDialog(false);
  };

  const handleDeleteWishlistItem = (wishlistItemId: string) => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      savingsWishlist: currentUserData.savingsWishlist.filter((item) => item.id !== wishlistItemId),
    }));
    toast.success("Wishlist item deleted");
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reserve</p>
          <h1 className="page-title flex items-center gap-2">
            <PiggyBank className="h-6 w-6" />
            Savings
          </h1>
        </div>
      </div>

      <Card className="hero-card border-0">
        <CardContent className="relative space-y-5 overflow-hidden pt-5">
          <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-foreground/72">Total Savings</p>
              <p className="mt-2 text-[2.45rem] font-semibold tracking-[-0.05em] text-primary-foreground">
                {formatUserCurrency(userData.savings, userData.currencySettings)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="secondary"
                className="border-white/16 bg-white/10 text-white hover:bg-white/10"
              >
                {userData.savingsLocked ? (
                  <>
                    <Lock className="h-3 w-3" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    Unlocked
                  </>
                )}
              </Badge>
              <PiggyBank className="h-5 w-5 text-primary-foreground/80" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setShowAddSavings(true)} variant="secondary" size="lg" className="w-full">
              <Plus className="mr-1 h-4 w-4" />
              Add to Savings
            </Button>
            <Button
              onClick={handleWithdrawClick}
              variant="outline"
              size="lg"
              className="w-full border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              disabled={userData.savings <= 0}
            >
              <TrendingUp className="mr-1 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="app-list-row flex items-center justify-between gap-4">
            <div>
              <p className="app-list-title">{userData.savingsLocked ? "Savings are locked" : "Savings are unlocked"}</p>
              <p className="app-list-meta">
                {!supportsPasswordLock
                  ? "Google accounts keep savings access simple for now."
                  : userData.savingsLocked
                  ? "Withdrawals need your password."
                  : "Lock it when you want extra friction."}
              </p>
            </div>
            <Button
              onClick={handleToggleLock}
              variant={userData.savingsLocked ? "destructive" : "outline"}
              disabled={!supportsPasswordLock}
            >
              {userData.savingsLocked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Lock
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Savings Wishlist
                </CardTitle>
              </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingWishlistItem(null);
                setShowWishlistDialog(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedWishlist.length === 0 ? (
            <div className="app-empty-state space-y-3">
              <Sparkles className="mx-auto mb-3 h-5 w-5 text-primary" />
              <p className="font-medium">No wishlist items yet</p>
              <p className="text-sm text-muted-foreground">Add your next savings target.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingWishlistItem(null);
                  setShowWishlistDialog(true);
                }}
              >
                Add Item
              </Button>
            </div>
          ) : (
            sortedWishlist.map((item) => {
              const progress = item.targetCost > 0 ? Math.min((userData.savings / item.targetCost) * 100, 100) : 0;
              const remaining = Math.max(item.targetCost - userData.savings, 0);
              const reached = remaining === 0;

              return (
                <div key={item.id} className="app-list-row">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="app-list-title">{item.name}</p>
                        <Badge variant={reached ? "default" : "secondary"}>
                          {reached ? "Ready" : `${progress.toFixed(0)}%`}
                        </Badge>
                      </div>
                      <p className="app-list-meta">
                        {formatUserCurrency(userData.savings, userData.currencySettings)} saved out of{" "}
                        {formatUserCurrency(item.targetCost, userData.currencySettings)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingWishlistItem(item);
                          setShowWishlistDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteWishlistItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Progress value={progress} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(0)}% funded</span>
                      <span>
                        {reached
                          ? "Target reached"
                          : `${formatUserCurrency(remaining, userData.currencySettings)} to go`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Savings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="app-list-row">
            <p>Money moved to savings stays separate from your main spending balance.</p>
          </div>
          <div className="app-list-row">
            <p>Wishlist items do not deduct from savings. They only track progress against your current savings total.</p>
          </div>
          <div className="app-list-row">
            <p>Custom wallets remain independent from both your main balance and your savings reserve.</p>
          </div>
        </CardContent>
      </Card>

      <AddSavingsDialog
        open={showAddSavings}
        onOpenChange={setShowAddSavings}
        onAddSavings={handleAddSavings}
        currentBalance={userData.balance}
        currencySettings={userData.currencySettings}
      />

      <WithdrawSavingsDialog
        open={showWithdrawSavings}
        onOpenChange={setShowWithdrawSavings}
        onWithdraw={handleWithdrawSavings}
        currentSavings={userData.savings}
        currencySettings={userData.currencySettings}
      />

      <UnlockSavingsDialog
        open={showUnlockSavings}
        onOpenChange={setShowUnlockSavings}
        onUnlock={handleUnlock}
      />

      <WishlistItemDialog
        open={showWishlistDialog}
        onOpenChange={(open) => {
          setShowWishlistDialog(open);
          if (!open) {
            setEditingWishlistItem(null);
          }
        }}
        currencySettings={userData.currencySettings}
        item={editingWishlistItem}
        onSave={handleSaveWishlistItem}
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
