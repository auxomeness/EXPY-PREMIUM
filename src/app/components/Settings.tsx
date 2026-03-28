import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AtSign,
  Bell,
  CalendarRange,
  Coins,
  Lock,
  LogOut,
  Moon,
  RefreshCcw,
  Settings2,
  Sun,
  Tags,
  Trash2,
  UserCircle,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { ActiveAccount, BudgetPeriod, SupportedCurrency, UserData } from "../App";
import { isDateExempt } from "../utils/finance";
import {
  SUPPORTED_CURRENCIES,
  applyExchangeRateUpdate,
  buildManualCurrencyOverride,
  clearManualCurrencyOverride,
  convertFromBaseCurrency,
  convertToBaseCurrency,
  fetchExchangeRates,
  formatUserCurrency,
  getEffectiveExchangeRate,
} from "../utils/currency";
import {
  createDefaultUserData,
  getActiveWallets,
  getStoredUsers,
  getUserData,
  saveUserData,
  subscribeToUserData,
  updateUserData,
  writeStoredUsers,
} from "../utils/userData";
import { ExemptionManagerDialog } from "./ExemptionManagerDialog";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { LoadingScreen } from "./LoadingScreen";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { WalletManagerDialog } from "./WalletManagerDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { cn } from "./ui/utils";

type SettingsProps = {
  username: string;
  onLogout: () => void;
  activeAccount: ActiveAccount;
  onOpenWallet: (walletId: string | null) => void;
};

type SettingsSectionProps = {
  value: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
};

function SettingsSection({ value, title, subtitle, badge, tone = "default", children }: SettingsSectionProps) {
  return (
    <AccordionItem
      value={value}
      className={cn(
        "rounded-[24px] border border-border/70 bg-card/95 px-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]",
        tone === "danger" && "border-destructive/40",
      )}
    >
      <AccordionTrigger className="py-5 text-left hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pr-2">
          <div className="min-w-0">
            <p className="text-[1.02rem] font-semibold tracking-[-0.015em]">{title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{subtitle}</p>
          </div>
          {badge}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5">{children}</AccordionContent>
    </AccordionItem>
  );
}

export function Settings({ username, onLogout, activeAccount, onOpenWallet }: SettingsProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [thresholdPercentage, setThresholdPercentage] = useState("20");
  const [budgetAmount, setBudgetAmount] = useState("0.00");
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dayEndTime, setDayEndTime] = useState("22:00");
  const [selectedWalletBudgetId, setSelectedWalletBudgetId] = useState("");
  const [walletBudgetAmount, setWalletBudgetAmount] = useState("0.00");
  const [walletBudgetPeriod, setWalletBudgetPeriod] = useState<BudgetPeriod>("monthly");
  const [walletAutoBudgetEnabled, setWalletAutoBudgetEnabled] = useState(false);
  const [manualRate, setManualRate] = useState("");
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showExemptions, setShowExemptions] = useState(false);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  useEffect(() => {
    const currentUserData = getUserData(username) ?? createDefaultUserData(username);
    setUserData(currentUserData);

    return subscribeToUserData(username, (nextUserData) => {
      setUserData(nextUserData);
    });
  }, [username]);

  useEffect(() => {
    setThresholdPercentage(userData.thresholdPercentage.toString());
    setBudgetAmount(convertFromBaseCurrency(userData.budgetAmount, userData.currencySettings).toFixed(2));
    setDisplayName(userData.displayName || "");
    setDayEndTime(userData.dayEndTime || "22:00");

    const preferredCurrency = userData.currencySettings.preferredCurrency;
    const rate =
      userData.currencySettings.manualExchangeRates[preferredCurrency] ??
      userData.currencySettings.exchangeRates[preferredCurrency] ??
      1;
    setManualRate(rate.toFixed(4));
  }, [userData]);

  useEffect(() => {
    const darkMode = localStorage.getItem("expy_dark_mode") === "true";
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const activeWallets = useMemo(() => getActiveWallets(userData), [userData]);
  const selectedWalletForBudget = useMemo(
    () => activeWallets.find((wallet) => wallet.id === selectedWalletBudgetId) ?? null,
    [activeWallets, selectedWalletBudgetId],
  );
  const thresholdAmount =
    (Number.parseFloat(thresholdPercentage || "0") / 100) * userData.initialBalance;
  const preferredCurrency = userData.currencySettings.preferredCurrency;
  const baseCurrency = userData.currencySettings.baseCurrency;
  const activeAccountLabel =
    activeAccount.kind === "main"
      ? "Main Balance"
      : activeWallets.find((wallet) => wallet.id === activeAccount.walletId)?.name || "Archived Wallet";
  const liveRate = userData.currencySettings.exchangeRates[preferredCurrency];
  const manualRateOverride = userData.currencySettings.manualExchangeRates[preferredCurrency];

  useEffect(() => {
    if (activeWallets.length === 0) {
      setSelectedWalletBudgetId("");
      return;
    }

    const preferredWalletId =
      activeAccount.kind === "wallet" && activeWallets.some((wallet) => wallet.id === activeAccount.walletId)
        ? activeAccount.walletId
        : activeWallets[0].id;

    if (!selectedWalletBudgetId || !activeWallets.some((wallet) => wallet.id === selectedWalletBudgetId)) {
      setSelectedWalletBudgetId(preferredWalletId);
    }
  }, [activeAccount, activeWallets, selectedWalletBudgetId]);

  useEffect(() => {
    if (!selectedWalletForBudget) {
      setWalletAutoBudgetEnabled(false);
      setWalletBudgetAmount("0.00");
      setWalletBudgetPeriod("monthly");
      return;
    }

    setWalletAutoBudgetEnabled(selectedWalletForBudget.autoBudgetEnabled);
    setWalletBudgetAmount(convertFromBaseCurrency(selectedWalletForBudget.budgetAmount, userData.currencySettings).toFixed(2));
    setWalletBudgetPeriod(selectedWalletForBudget.budgetPeriod);
  }, [selectedWalletForBudget, userData.currencySettings]);

  const saveThreshold = () => {
    const threshold = Number.parseFloat(thresholdPercentage);

    if (Number.isNaN(threshold) || threshold < 0 || threshold > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      thresholdPercentage: threshold,
    }));
    toast.success("Low-balance alert updated");
  };

  const saveBudgetAmount = () => {
    const amount = Number.parseFloat(budgetAmount);

    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid auto budget amount");
      return;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      budgetAmount: convertToBaseCurrency(amount, currentUserData.currencySettings),
      lastBudgetReset: new Date().toISOString(),
    }));
    toast.success("Auto budget amount updated");
  };

  const handleBudgetPeriodChange = (period: BudgetPeriod) => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      budgetPeriod: period,
    }));
    toast.success(`Budget period updated to ${period}`);
  };

  const handleUpdateCategories = (categories: string[]) => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      customCategories: categories,
    }));
  };

  const toggleDarkMode = () => {
    const nextDarkMode = !isDarkMode;
    setIsDarkMode(nextDarkMode);
    localStorage.setItem("expy_dark_mode", String(nextDarkMode));

    if (nextDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast.success(`${nextDarkMode ? "Dark" : "Light"} mode enabled`);
  };

  const handleDisplayNameChange = () => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      displayName: displayName.trim(),
    }));
    toast.success("Display name updated");
  };

  const handleUsernameChange = () => {
    const trimmedUsername = newUsername.trim();

    if (!trimmedUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    if (trimmedUsername.length > 10) {
      toast.error("Username must be 10 characters or less");
      return;
    }

    const users = getStoredUsers();
    if (users[trimmedUsername]) {
      toast.error("Username already exists");
      return;
    }

    const currentUserData = users[username];
    if (!currentUserData) {
      toast.error("Unable to load the current account");
      return;
    }

    users[trimmedUsername] = {
      ...currentUserData,
      username: trimmedUsername,
    };
    delete users[username];
    writeStoredUsers(users);
    localStorage.setItem("expy_current_user", trimmedUsername);

    toast.success("Username changed successfully");
    setIsChangingUsername(true);
    window.setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (userData.password !== currentPassword) {
      toast.error("Current password is incorrect");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one capital letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(newPassword)) {
      toast.error("Password must contain at least one special character");
      return;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      password: newPassword,
    }));

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password changed successfully");
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Notification permission granted");
        return true;
      }

      toast.error("Notification permission denied");
      return false;
    } catch {
      toast.error("Failed to request notification permission");
      return false;
    }
  };

  const toggleNotifications = async (checked: boolean) => {
    if (checked && notificationPermission !== "granted") {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return;
      }
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      notificationsEnabled: checked,
      dayEndTime,
    }));
    toast.success(`Daily notifications ${checked ? "enabled" : "disabled"}`);
  };

  const saveDayEndTime = () => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      dayEndTime,
    }));
    toast.success("Day end time updated");
  };

  const refreshRates = async (sourceUserData = userData) => {
    setIsRefreshingRates(true);

    try {
      const exchangeRatePayload = await fetchExchangeRates(baseCurrency);
      const nextUserData = {
        ...sourceUserData,
        currencySettings: applyExchangeRateUpdate(sourceUserData.currencySettings, exchangeRatePayload),
      };
      saveUserData(username, nextUserData);
      toast.success("Exchange rates refreshed");
    } catch {
      toast.error("Unable to refresh exchange rates right now");
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleCurrencyChange = async (currencyCode: SupportedCurrency) => {
    const nextSettings = {
      ...userData.currencySettings,
      preferredCurrency: currencyCode,
    };

    const nextUserData = {
      ...userData,
      currencySettings: nextSettings,
    };
    saveUserData(username, nextUserData);

    if (currencyCode !== baseCurrency) {
      await refreshRates(nextUserData);
    } else {
      toast.success("App currency updated");
    }
  };

  const handleSaveManualRate = () => {
    if (preferredCurrency === baseCurrency) {
      toast.error("Manual conversion is only needed when app currency differs from the base currency");
      return;
    }

    const parsedRate = Number.parseFloat(manualRate);

    if (Number.isNaN(parsedRate) || parsedRate <= 0) {
      toast.error("Please enter a valid manual exchange rate");
      return;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      currencySettings: buildManualCurrencyOverride(
        currentUserData.currencySettings,
        preferredCurrency,
        parsedRate,
      ),
    }));
    toast.success("Manual exchange rate saved");
  };

  const handleClearManualRate = () => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      currencySettings: clearManualCurrencyOverride(currentUserData.currencySettings, preferredCurrency),
    }));
    toast.success("Manual override cleared");
  };

  const handleClearHistory = () => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      expenses: [],
      transactions: currentUserData.transactions.filter((transaction) => transaction.type !== "expense"),
    }));
    toast.success("Main expense history cleared");
  };

  const handleResetBalance = () => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      balance: 0,
      initialBalance: 0,
    }));
    toast.success("Main balance reset");
  };

  const handleDeactivateAccount = () => {
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      isActive: false,
    }));
    toast.success("Account deactivated");
    onLogout();
  };

  const handleDeleteAccount = () => {
    const users = getStoredUsers();
    delete users[username];
    writeStoredUsers(users);
    toast.success("Account deleted permanently");
    onLogout();
  };

  const handleExcludeToday = () => {
    if (isDateExempt(new Date(), userData.computationExemptions)) {
      toast.message("Today is already excluded");
      return;
    }

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
    toast.success("Today excluded from automatic computations");
  };

  const handleWalletBudgetToggle = (enabled: boolean) => {
    if (!selectedWalletForBudget) return;

    setWalletAutoBudgetEnabled(enabled);
    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      wallets: currentUserData.wallets.map((wallet) =>
        wallet.id === selectedWalletForBudget.id
          ? {
              ...wallet,
              autoBudgetEnabled: enabled,
              updatedAt: new Date().toISOString(),
            }
          : wallet,
      ),
    }));
    toast.success(enabled ? `${selectedWalletForBudget.name} auto budget enabled` : `${selectedWalletForBudget.name} auto budget turned off`);
  };

  const handleSaveWalletBudget = () => {
    if (!selectedWalletForBudget) return;

    const parsedBudgetAmount = Number.parseFloat(walletBudgetAmount);

    if (Number.isNaN(parsedBudgetAmount) || parsedBudgetAmount < 0) {
      toast.error("Please enter a valid wallet auto budget amount");
      return;
    }

    updateUserData(username, (currentUserData) => ({
      ...currentUserData,
      wallets: currentUserData.wallets.map((wallet) =>
        wallet.id === selectedWalletForBudget.id
          ? {
              ...wallet,
              budgetAmount: convertToBaseCurrency(parsedBudgetAmount, currentUserData.currencySettings),
              budgetPeriod: walletBudgetPeriod,
              autoBudgetEnabled: walletAutoBudgetEnabled,
              updatedAt: new Date().toISOString(),
            }
          : wallet,
      ),
    }));
    toast.success(`${selectedWalletForBudget.name} budget settings saved`);
  };

  if (isChangingUsername) {
    return <LoadingScreen />;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preferences</p>
          <h1 className="page-title flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Settings
          </h1>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["appearance", "money"]} className="space-y-4">
        <SettingsSection
          value="appearance"
          title="Appearance"
          subtitle="Theme and display preferences."
          badge={<Badge variant="secondary">{isDarkMode ? "Dark" : "Light"}</Badge>}
        >
          <div className="app-list-row flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <p className="app-list-title">Dark Mode</p>
                <p className="app-list-meta">{isDarkMode ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <Button onClick={toggleDarkMode} variant="outline">
              {isDarkMode ? "Disable" : "Enable"}
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          value="money"
          title="Money & Currency"
          subtitle="App currency, rates, and main balance rules."
          badge={
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-3 w-3" />
              {preferredCurrency}
            </Badge>
          }
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Currency</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preferred-currency">App currency</Label>
                  <Select value={preferredCurrency} onValueChange={(value) => void handleCurrencyChange(value as SupportedCurrency)}>
                    <SelectTrigger id="preferred-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.label} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Base currency</Label>
                  <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
                    {baseCurrency}
                  </div>
                </div>
              </div>

              <div className="app-list-row flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="app-list-title">Rate metadata</p>
                  <p className="app-list-meta">
                    {userData.currencySettings.source.toUpperCase()}
                    {userData.currencySettings.provider ? ` • ${userData.currencySettings.provider}` : ""}
                  </p>
                  <p className="app-list-meta">
                    {userData.currencySettings.lastUpdated
                      ? new Date(userData.currencySettings.lastUpdated).toLocaleString()
                      : "Not fetched yet"}
                  </p>
                </div>
                <Button variant="outline" onClick={() => void refreshRates()} disabled={isRefreshingRates}>
                  <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshingRates ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {preferredCurrency !== baseCurrency && (
                <div className="space-y-3 rounded-[22px] border border-border/70 bg-card/85 p-4">
                  <div>
                    <p className="app-list-title">Manual fallback override</p>
                    <p className="app-list-meta">Only use this when live rates are unavailable.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-rate">1 {baseCurrency} equals</Label>
                    <Input
                      id="manual-rate"
                      value={manualRate}
                      onChange={(event) => setManualRate(event.target.value)}
                      placeholder="0.0000"
                    />
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Live: {liveRate ? liveRate.toFixed(4) : "Unavailable"} {preferredCurrency}</span>
                      <span>Effective: {getEffectiveExchangeRate(userData.currencySettings, preferredCurrency).toFixed(4)} {preferredCurrency}</span>
                      {manualRateOverride && <span>Manual override active</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveManualRate} variant="outline" className="flex-1">
                      Save Manual Rate
                    </Button>
                    <Button
                      onClick={handleClearManualRate}
                      variant="ghost"
                      className="flex-1"
                      disabled={!manualRateOverride}
                    >
                      Clear Override
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Main Balance</p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="muted-tile py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current</p>
                  <p className="mt-1.5 text-base font-semibold">{formatUserCurrency(userData.balance, userData.currencySettings)}</p>
                </div>
                <div className="muted-tile py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tracked</p>
                  <p className="mt-1.5 text-base font-semibold">{formatUserCurrency(userData.initialBalance, userData.currencySettings)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-period">Budget Period</Label>
                <Select value={userData.budgetPeriod} onValueChange={(value) => handleBudgetPeriodChange(value as BudgetPeriod)}>
                  <SelectTrigger id="budget-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Budget</SelectItem>
                    <SelectItem value="weekly">Weekly Budget</SelectItem>
                    <SelectItem value="monthly">Monthly Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-amount">Auto Budget Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    value={budgetAmount}
                    onChange={(event) => setBudgetAmount(event.target.value)}
                  />
                  <Button onClick={saveBudgetAmount} variant="outline">
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Stored in {baseCurrency}, shown in {preferredCurrency}.</p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          value="wallets"
          title="Wallets & Exemptions"
          subtitle="Independent wallet controls and excluded days."
          badge={<Badge variant="secondary">{activeWallets.length} wallet{activeWallets.length === 1 ? "" : "s"}</Badge>}
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Wallet Management</p>
              <div className="app-list-row flex items-center justify-between gap-4">
                <div>
                  <p className="app-list-title">Currently active</p>
                  <p className="app-list-meta">{activeAccountLabel}</p>
                </div>
                <Button onClick={() => setShowWalletManager(true)} variant="outline">
                  Manage
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Wallet Budget</p>
              {activeWallets.length === 0 ? (
                <div className="app-empty-state text-sm text-muted-foreground">
                  Create a wallet first to manage its auto budget.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wallet-budget-wallet">Selected Wallet</Label>
                    <Select value={selectedWalletBudgetId} onValueChange={setSelectedWalletBudgetId}>
                      <SelectTrigger id="wallet-budget-wallet">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {activeWallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedWalletForBudget && (
                    <>
                      <div className="app-list-row flex items-center justify-between gap-4">
                        <div>
                          <p className="app-list-title">Wallet auto budget</p>
                          <p className="app-list-meta">
                            {walletAutoBudgetEnabled ? `Active for ${selectedWalletForBudget.name}.` : `Off for ${selectedWalletForBudget.name}.`}
                          </p>
                        </div>
                        <Switch checked={walletAutoBudgetEnabled} onCheckedChange={handleWalletBudgetToggle} />
                      </div>

                      {walletAutoBudgetEnabled ? (
                        <>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="wallet-budget-amount">Auto Budget Amount</Label>
                              <Input
                                id="wallet-budget-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={walletBudgetAmount}
                                onChange={(event) => setWalletBudgetAmount(event.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="wallet-budget-period">Budget Period</Label>
                              <Select value={walletBudgetPeriod} onValueChange={(value) => setWalletBudgetPeriod(value as BudgetPeriod)}>
                                <SelectTrigger id="wallet-budget-period">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily Budget</SelectItem>
                                  <SelectItem value="weekly">Weekly Budget</SelectItem>
                                  <SelectItem value="monthly">Monthly Budget</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="app-list-row flex items-center justify-between gap-3">
                            <div>
                              <p className="app-list-title">
                                {walletBudgetAmount || "0.00"} {preferredCurrency} every {walletBudgetPeriod}
                              </p>
                              <p className="app-list-meta">Stored internally in {baseCurrency}.</p>
                            </div>
                            <Button onClick={handleSaveWalletBudget} variant="outline">
                              Save
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="app-empty-state text-sm text-muted-foreground">
                          Wallet budget stays hidden on the Wallets tab until auto budget is turned on.
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Exempted Days</p>
              <div className="app-list-row flex items-center justify-between gap-4">
                <div>
                  <p className="app-list-title">
                    {userData.computationExemptions.length} exemption{userData.computationExemptions.length === 1 ? "" : "s"} configured
                  </p>
                  <p className="app-list-meta">Used across budgets and spending summaries.</p>
                </div>
                <Button variant="outline" onClick={handleExcludeToday}>
                  Exclude Today
                </Button>
              </div>

              <Button onClick={() => setShowExemptions(true)} variant="outline" className="w-full">
                Manage Exempted Days
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          value="alerts"
          title="Alerts & Categories"
          subtitle="Reminder timing, low-balance alerts, and expense categories."
          badge={<Badge variant="secondary">{userData.notificationsEnabled ? "Alerts On" : "Alerts Off"}</Badge>}
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Alerts</p>
              <div className="app-list-row flex items-center justify-between gap-4">
                <div>
                  <p className="app-list-title">Daily Reminder</p>
                  <p className="app-list-meta">Sent one hour before your day ends.</p>
                </div>
                <Switch
                  checked={userData.notificationsEnabled}
                  onCheckedChange={(checked) => void toggleNotifications(checked)}
                />
              </div>

              {userData.notificationsEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="day-end-time">Day End Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="day-end-time"
                      type="time"
                      value={dayEndTime}
                      onChange={(event) => setDayEndTime(event.target.value)}
                    />
                    <Button onClick={saveDayEndTime} variant="outline">
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Reminder fires one hour before {dayEndTime}.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="threshold">Low Balance Alert (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={thresholdPercentage}
                    onChange={(event) => setThresholdPercentage(event.target.value)}
                  />
                  <Button onClick={saveThreshold} variant="outline">
                    Save
                  </Button>
                </div>
                {userData.initialBalance > 0 && (
                  <div className="app-list-row">
                    <p className="app-list-meta">Alert triggers below</p>
                    <p className="mt-1 text-base font-semibold">{formatUserCurrency(thresholdAmount, userData.currencySettings)}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Categories</p>
              <div className="app-list-row flex items-center justify-between gap-4">
                <div>
                  <p className="app-list-title">{userData.customCategories.length} custom categor{userData.customCategories.length === 1 ? "y" : "ies"}</p>
                  <p className="app-list-meta">Default categories stay available everywhere.</p>
                </div>
                <Button onClick={() => setShowManageCategories(true)} variant="outline">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          value="profile"
          title="Profile & Security"
          subtitle="Display name, username, and password."
          badge={<Badge variant="secondary">@{username}</Badge>}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <Label htmlFor="display-name">Display Name</Label>
              </div>
              <FloatingLabelInput
                type="text"
                label="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <Button onClick={handleDisplayNameChange} variant="outline" className="w-full">
                Save Display Name
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AtSign className="h-4 w-4" />
                <Label htmlFor="new-username">Change Username</Label>
              </div>
              <FloatingLabelInput
                type="text"
                label="New username"
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
                maxLength={10}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={!newUsername.trim()} className="w-full">
                    Change Username
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Change Username?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your login will change from @{username} to @{newUsername.trim()}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUsernameChange}>Change Username</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <Label>Change Password</Label>
              </div>
              <FloatingLabelInput
                type="password"
                label="Current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <FloatingLabelInput
                type="password"
                label="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <FloatingLabelInput
                type="password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters with a capital letter, number, and special character.
              </p>
              <Button
                onClick={handlePasswordChange}
                className="w-full"
                variant="outline"
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          value="danger"
          title="Danger Zone"
          subtitle="Reset or permanently remove account data."
          tone="danger"
        >
          <div className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Main Expense History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear main expense history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes main-balance expense entries and expense transactions. Savings, wallets, and profile data stay intact.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground">
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Main Balance
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset main balance?</AlertDialogTitle>
                <AlertDialogDescription>
                  This sets your main balance and tracked initial balance back to {formatUserCurrency(0, userData.currencySettings)}. Savings and wallets are not changed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetBalance} className="bg-destructive text-destructive-foreground">
                  Reset Balance
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-orange-600 dark:text-orange-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Deactivate Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out, but your data stays stored so you can come back later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivateAccount} className="bg-orange-600 text-white hover:bg-orange-700">
                  Deactivate Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account Permanently
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes your account, balances, savings, wallets, settings, and transaction history forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </SettingsSection>
      </Accordion>

      <Button onClick={onLogout} variant="outline" className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>

      <ManageCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
        customCategories={userData.customCategories}
        onUpdateCategories={handleUpdateCategories}
      />

      <ExemptionManagerDialog
        open={showExemptions}
        onOpenChange={setShowExemptions}
        exemptions={userData.computationExemptions}
        onChange={(nextExemptions) =>
          updateUserData(username, (currentUserData) => ({
            ...currentUserData,
            computationExemptions: nextExemptions,
          }))
        }
        onExcludeToday={handleExcludeToday}
        todayExcluded={isDateExempt(new Date(), userData.computationExemptions)}
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
          setShowWalletManager(false);
          onOpenWallet(walletId);
        }}
        currencySettings={userData.currencySettings}
      />
    </div>
  );
}
