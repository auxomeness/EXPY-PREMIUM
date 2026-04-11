import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Pencil, PlusCircle, Trash2, Wallet } from "lucide-react";
import type { BudgetPeriod, CurrencySettings, CustomWallet } from "../App";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { convertFromBaseCurrency, convertToBaseCurrency, formatCurrency, formatUserCurrency } from "../utils/currency";
import { createEmptyWallet } from "../utils/userData";
import { toast } from "sonner";

type WalletManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: CustomWallet[];
  onChange: (nextWallets: CustomWallet[]) => void;
  onOpenWallet: (walletId: string) => void;
  currencySettings: CurrencySettings;
};

const DEFAULT_FORM_STATE = {
  name: "",
  balance: "",
  budgetAmount: "",
  thresholdPercentage: "20",
  budgetPeriod: "monthly" as BudgetPeriod,
  includeInTotal: false,
  showOnHome: false,
};

export function WalletManagerDialog({
  open,
  onOpenChange,
  wallets,
  onChange,
  onOpenWallet,
  currencySettings,
}: WalletManagerDialogProps) {
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);

  useEffect(() => {
    if (!open) {
      setEditingWalletId(null);
      setFormState(DEFAULT_FORM_STATE);
    }
  }, [open]);

  const activeWallets = useMemo(() => wallets.filter((wallet) => !wallet.archived), [wallets]);
  const archivedWallets = useMemo(() => wallets.filter((wallet) => wallet.archived), [wallets]);

  const resetForm = () => {
    setEditingWalletId(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    const parsedBalance = parseFloat(formState.balance);
    const parsedBudgetAmount = parseFloat(formState.budgetAmount || "0");
    const parsedThreshold = parseFloat(formState.thresholdPercentage || "20");

    if (!trimmedName) {
      toast.error("Please enter a wallet name");
      return;
    }

    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      toast.error("Please enter a valid wallet balance");
      return;
    }

    if (Number.isNaN(parsedBudgetAmount) || parsedBudgetAmount < 0) {
      toast.error("Please enter a valid auto budget amount");
      return;
    }

    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 100) {
      toast.error("Low-balance alert must be between 0 and 100");
      return;
    }

    const duplicateName = wallets.some(
      (wallet) => wallet.name.toLowerCase() === trimmedName.toLowerCase() && wallet.id !== editingWalletId,
    );

    if (duplicateName) {
      toast.error("A wallet with that name already exists");
      return;
    }

    const now = new Date().toISOString();
    const balanceInBaseCurrency = convertToBaseCurrency(parsedBalance, currencySettings);
    const budgetAmountInBaseCurrency = convertToBaseCurrency(parsedBudgetAmount, currencySettings);

    const nextWallets = editingWalletId
      ? wallets.map((wallet) =>
          wallet.id === editingWalletId
            ? {
                ...wallet,
                name: trimmedName,
                balance: balanceInBaseCurrency,
                initialBalance: balanceInBaseCurrency,
                budgetAmount: budgetAmountInBaseCurrency,
                thresholdPercentage: parsedThreshold,
                budgetPeriod: formState.budgetPeriod,
                includeInTotal: formState.includeInTotal,
                showOnHome: formState.showOnHome,
                updatedAt: now,
              }
            : wallet,
        )
      : [
          ...wallets,
          {
            ...createEmptyWallet(trimmedName),
            name: trimmedName,
            balance: balanceInBaseCurrency,
            initialBalance: balanceInBaseCurrency,
            budgetAmount: budgetAmountInBaseCurrency,
            thresholdPercentage: parsedThreshold,
            budgetPeriod: formState.budgetPeriod,
            includeInTotal: formState.includeInTotal,
            showOnHome: formState.showOnHome,
            createdAt: now,
            updatedAt: now,
          },
        ];

    onChange(nextWallets);
    toast.success(editingWalletId ? "Wallet updated" : "Wallet created");
    resetForm();
  };

  const handleEdit = (wallet: CustomWallet) => {
    setEditingWalletId(wallet.id);
    setFormState({
      name: wallet.name,
      balance: convertFromBaseCurrency(wallet.balance, currencySettings).toFixed(2),
      budgetAmount: convertFromBaseCurrency(wallet.budgetAmount, currencySettings).toFixed(2),
      thresholdPercentage: wallet.thresholdPercentage.toString(),
      budgetPeriod: wallet.budgetPeriod,
      includeInTotal: wallet.includeInTotal,
      showOnHome: wallet.showOnHome,
    });
  };

  const handleArchiveToggle = (walletId: string, archived: boolean) => {
    const now = new Date().toISOString();

    onChange(
      wallets.map((wallet) =>
        wallet.id === walletId ? { ...wallet, archived, updatedAt: now } : wallet,
      ),
    );
    toast.success(archived ? "Wallet archived" : "Wallet restored");
  };

  const handleDelete = (walletId: string) => {
    onChange(wallets.filter((wallet) => wallet.id !== walletId));
    toast.success("Wallet deleted");

    if (editingWalletId === walletId) {
      resetForm();
    }
  };

  const renderWalletRow = (wallet: CustomWallet) => (
    <div
      key={wallet.id}
      className="flex items-start justify-between gap-3 rounded-[22px] border border-border/70 bg-card/70 p-4"
    >
      <div>
        <p className="font-medium">{wallet.name}</p>
        <p className="text-sm text-muted-foreground">
          Balance {formatUserCurrency(wallet.balance, currencySettings)}
        </p>
        <p className="text-xs text-muted-foreground">
          Budget {formatUserCurrency(wallet.budgetAmount, currencySettings)} • {wallet.budgetPeriod}
        </p>
        <p className="text-xs text-muted-foreground">
          {wallet.includeInTotal ? "Included in total balance" : "Excluded from total balance"} • {wallet.showOnHome ? "Visible on home" : "Hidden on home"}
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-1">
        {!wallet.archived && (
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenWallet(wallet.id)}>
            Open
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(wallet)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleArchiveToggle(wallet.id, !wallet.archived)}
        >
          {wallet.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => handleDelete(wallet.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage Custom Wallets</DrawerTitle>
          <DrawerDescription>
            Create separate purpose-based wallets without affecting your primary accounts or savings by default.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-5 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-border/70 bg-card/70 p-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">{editingWalletId ? "Edit Custom Wallet" : "Create Custom Wallet"}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-name">Wallet name</Label>
              <Input
                id="wallet-name"
                placeholder="Travel, Tuition, Gifts..."
                value={formState.name}
                onChange={(event) => setFormState((currentState) => ({ ...currentState, name: event.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wallet-balance">Wallet balance</Label>
                <Input
                  id="wallet-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={formatCurrency(0, currencySettings.preferredCurrency)}
                  value={formState.balance}
                  onChange={(event) =>
                    setFormState((currentState) => ({ ...currentState, balance: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-threshold">Low-balance alert (%)</Label>
                <Input
                  id="wallet-threshold"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formState.thresholdPercentage}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      thresholdPercentage: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wallet-budget-amount">Auto budget amount</Label>
                <Input
                  id="wallet-budget-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={formatCurrency(0, currencySettings.preferredCurrency)}
                  value={formState.budgetAmount}
                  onChange={(event) =>
                    setFormState((currentState) => ({ ...currentState, budgetAmount: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-budget-period">Budget period</Label>
                <Select
                  value={formState.budgetPeriod}
                  onValueChange={(value) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      budgetPeriod: value as BudgetPeriod,
                    }))
                  }
                >
                  <SelectTrigger id="wallet-budget-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-border/65 bg-background/80 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="app-list-title">Include in total balance</p>
                  <p className="app-list-meta">Off by default so Custom Wallets stay separate from account totals.</p>
                </div>
                <Switch
                  checked={formState.includeInTotal}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      includeInTotal: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="app-list-title">Show on home</p>
                  <p className="app-list-meta">Allow this Custom Wallet to appear in future home displays.</p>
                </div>
                <Switch
                  checked={formState.showOnHome}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      showOnHome: checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingWalletId && (
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" className="flex-1">
                {editingWalletId ? "Save Custom Wallet" : "Create Custom Wallet"}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-primary" />
                Active Custom Wallets
              </h3>
              <span className="text-xs text-muted-foreground">{activeWallets.length}</span>
            </div>

            {activeWallets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No Custom Wallets yet. Create one for a trip, event, sinking fund, or any dedicated pocket of money.
              </div>
            ) : (
              <div className="space-y-2">{activeWallets.map(renderWalletRow)}</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Archived Custom Wallets</h3>
              <span className="text-xs text-muted-foreground">{archivedWallets.length}</span>
            </div>

            {archivedWallets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nothing archived.
              </div>
            ) : (
              <div className="space-y-2">{archivedWallets.map(renderWalletRow)}</div>
            )}
          </div>
        </div>

        <DrawerFooter className="pt-0">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
