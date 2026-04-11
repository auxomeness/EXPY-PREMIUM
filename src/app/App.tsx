import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from "react";
import { Ellipsis, History, Home, PiggyBank, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { WalletLoader } from "./components/WalletLoader";
import { migrateUserData } from "./utils/migration";
import { scheduleNotificationCheck } from "./utils/notifications";
import { createDemoAccount } from "./utils/createDemoAccount";
import { refreshUserCurrencyRatesIfNeeded } from "./utils/currency";
import { type GoogleProfile, type GoogleAuthMode } from "./utils/googleAuth";
import { createDefaultUserData, createUniqueUsername, findUserEntryByGoogleId, getPrimaryAccount, getStoredUsers, saveUserData, setPrimaryAccount, subscribeToUserData, writeStoredUsers } from "./utils/userData";
import { convertToBaseCurrency } from "./utils/currency";
import { getHomeDisplayAccount, updateAccountInUserData } from "./utils/accounts";
import { listPaymentSubmissions, subscribeToPayments } from "./utils/mockServer";
import { getResolvedUserPlan } from "./utils/premium";
import { QUICK_ACTION_OPTIONS } from "./utils/quickActions";
import { applyAccentTheme, applyColorMode, isDarkModeEnabled, subscribeToColorMode } from "./utils/theme";
import { QuickActionFab } from "./components/QuickActionFab";
import { AddExpenseDialog } from "./components/AddExpenseDialog";
import { AddMoneyDialog } from "./components/AddMoneyDialog";
import { AddSavingsDialog } from "./components/AddSavingsDialog";
import type { MoreDestination } from "./components/MoreHub";

export type SupportedCurrency =
  | "PHP"
  | "USD"
  | "EUR"
  | "CNY"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "HKD"
  | "SGD"
  | "CHF"
  | "INR"
  | "MXN"
  | "BRL"
  | "SEK"
  | "PLN"
  | "KRW"
  | "TRY"
  | "THB"
  | "NOK"
  | "MYR"
  | "AED";

export type AuthProvider = "local" | "google";

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
};

export type TransactionType =
  | "expense"
  | "add_money"
  | "add_savings"
  | "withdraw_savings"
  | "transfer_in"
  | "transfer_out"
  | "credit_payment";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category?: string; // Only for expenses
  description?: string; // Only for expenses
  date: string;
  sourceId?: string;
  sourceName?: string;
  destinationId?: string;
  destinationName?: string;
  relatedAccountId?: string;
};

export type BudgetPeriod = "daily" | "weekly" | "monthly";
export type UserPlan = "free" | "plus" | "pro";
export type PaymentMethod = "maya" | "bdo_pay" | "gcash";
export type PaymentSubmissionStatus = "submitted" | "verifying" | "approved" | "rejected";
export type PremiumClientStatus = "not_purchased" | "verifying" | "active" | "rejected";
export type HomeHeroMode = "total_balance" | "selected_account" | "savings_focus" | "subscription_summary";
export type AccountType = "cash" | "bank_account" | "debit_card" | "credit_card" | "e_wallet" | "savings_account";
export type AccountTheme = "default" | "gcash" | "maya" | "bpi" | "bdo" | "generic_bank" | "custom_card";
export type CustomCardMode = "color" | "black" | "white";
export type AccountBalanceModel = "standard" | "credit";
export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "canceled";
export type SupportConcernType = "payment_concern" | "upgrade_concern" | "account_concern" | "bug_report" | "other";
export type SupportMessageStatus = "unread" | "resolved";
export type QuickActionId =
  | "add_expense"
  | "add_money"
  | "transfer"
  | "add_savings"
  | "open_savings"
  | "open_accounts"
  | "open_wallets"
  | "open_premium"
  | "open_settings"
  | "toggle_theme";

export type CurrencySettings = {
  baseCurrency: SupportedCurrency;
  preferredCurrency: SupportedCurrency;
  exchangeRates: Partial<Record<SupportedCurrency, number>>;
  manualExchangeRates: Partial<Record<SupportedCurrency, number>>;
  lastUpdated: string;
  provider: string;
  source: "seed" | "api" | "manual";
};

export type ComputationExemption = {
  id: string;
  name: string;
  date: string;
  repeat: "none" | "weekly" | "monthly" | "yearly";
  createdAt: string;
  updatedAt: string;
};

export type CustomWallet = {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  expenses: Expense[];
  transactions: Transaction[];
  thresholdPercentage: number;
  autoBudgetEnabled: boolean;
  budgetPeriod: BudgetPeriod;
  budgetAmount: number;
  lastBudgetReset: string;
  includeInTotal: boolean;
  showOnHome: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Account = {
  id: string;
  name: string;
  accountType: AccountType;
  theme: AccountTheme;
  customColorMode?: CustomCardMode;
  customGradientStart?: string;
  customGradientEnd?: string;
  customColorHue?: number;
  balanceModel: AccountBalanceModel;
  balance: number;
  initialBalance: number;
  includeInTotal: boolean;
  showOnHome: boolean;
  archived: boolean;
  creditLimit: number;
  usedCredit: number;
  expenses: Expense[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
};

export type WishlistItem = {
  id: string;
  name: string;
  targetCost: number;
  createdAt: string;
  updatedAt: string;
};

export type ActiveAccount =
  | { kind: "main" }
  | { kind: "wallet"; walletId: string };

export type SubscriptionItem = {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextDueDate: string;
  linkedPaymentSourceId: string;
  category: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  homeHeroMode: HomeHeroMode;
  homeSelectedAccountId: string;
  homeHeroSwipeEnabled: boolean;
  homeHeroVisibleAccountIds: string[];
  quickActionIds: QuickActionId[];
  accountListOrderIds: string[];
  subscriptionListOrderIds: string[];
  dismissedDashboardWarningIds: string[];
  themeAccentHex: string;
};

export type PaymentSubmission = {
  id: string;
  userId: string;
  requestedPlan: Exclude<UserPlan, "free">;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  status: PaymentSubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
};

export type SupportMessage = {
  id: string;
  userId: string;
  concernType: SupportConcernType;
  subject: string;
  message: string;
  referenceNumber?: string;
  status: SupportMessageStatus;
  submittedAt: string;
};

export type UserData = {
  username: string;
  password?: string;
  authProvider: AuthProvider;
  email?: string;
  googleId?: string;
  avatarUrl?: string;
  displayName?: string;
  plan: UserPlan;
  balance: number;
  initialBalance: number;
  expenses: Expense[];
  transactions: Transaction[]; // New comprehensive transaction history
  accounts: Account[];
  thresholdPercentage: number;
  customCategories: string[];
  budgetPeriod: BudgetPeriod;
  budgetAmount: number; // Amount allocated per budget period
  lastBudgetReset: string; // ISO date string of last budget allocation
  isActive?: boolean;
  currentStreak: number; // Current consecutive days streak
  lastOpenedDate: string; // ISO date string of last app open
  savings: number; // Total savings amount
  savingsLocked: boolean; // Whether savings are locked
  notificationsEnabled: boolean; // Whether notifications are enabled
  dayEndTime: string; // Time when day ends (HH:mm format)
  lastNotificationDate: string; // ISO date string of last notification sent
  securityQuestions: {
    nickname: string;
    birthdate: string;
    favoriteColor: string;
    secretCode: string;
  };
  currencySettings: CurrencySettings;
  computationExemptions: ComputationExemption[];
  wallets: CustomWallet[];
  subscriptions: SubscriptionItem[];
  preferences: UserPreferences;
  savingsWishlist: WishlistItem[];
};

const APP_TABS: Array<{
  id: "home" | "history" | "savings" | "more";
  label: string;
  icon: LucideIcon;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: History },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "more", label: "More", icon: Ellipsis },
];

const AuthScreen = lazy(() => import("./components/AuthScreen").then((module) => ({ default: module.AuthScreen })));
const SecurityQuestionsSetup = lazy(() =>
  import("./components/SecurityQuestionsSetup").then((module) => ({ default: module.SecurityQuestionsSetup })),
);
const OnboardingScreen = lazy(() => import("./components/OnboardingScreen").then((module) => ({ default: module.OnboardingScreen })));
const WelcomeAnimation = lazy(() => import("./components/WelcomeAnimation").then((module) => ({ default: module.WelcomeAnimation })));
const Dashboard = lazy(() => import("./components/Dashboard").then((module) => ({ default: module.Dashboard })));
const ExpenseHistory = lazy(() => import("./components/ExpenseHistory").then((module) => ({ default: module.ExpenseHistory })));
const Savings = lazy(() => import("./components/Savings").then((module) => ({ default: module.Savings })));
const Settings = lazy(() => import("./components/Settings").then((module) => ({ default: module.Settings })));
const Wallets = lazy(() => import("./components/Wallets").then((module) => ({ default: module.Wallets })));
const MoreHub = lazy(() => import("./components/MoreHub").then((module) => ({ default: module.MoreHub })));
const AccountsWorkspace = lazy(() => import("./components/AccountsWorkspace").then((module) => ({ default: module.AccountsWorkspace })));
const PremiumPage = lazy(() => import("./components/PremiumPage").then((module) => ({ default: module.PremiumPage })));
const ContactUsPage = lazy(() => import("./components/ContactUsPage").then((module) => ({ default: module.ContactUsPage })));
const AdminPaymentsPage = lazy(() => import("./components/AdminPaymentsPage").then((module) => ({ default: module.AdminPaymentsPage })));
const SupportInboxPage = lazy(() => import("./components/SupportInboxPage").then((module) => ({ default: module.SupportInboxPage })));

function AppLoadingShell() {
  return (
    <div className="mobile-shell mobile-canvas">
      <div className="flex min-h-screen items-center justify-center px-6">
        <WalletLoader compact />
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [onboardingUser, setOnboardingUser] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "history" | "savings" | "more">("home");
  const [moreView, setMoreView] = useState<MoreDestination>("hub");
  const [accountsInitialSection, setAccountsInitialSection] = useState<"accounts" | "subscriptions" | "transfers">("accounts");
  const [securityQuestionsUser, setSecurityQuestionsUser] = useState<{ username: string; password: string } | null>(null);
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>({ kind: "main" });
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showQuickAddMoney, setShowQuickAddMoney] = useState(false);
  const [showQuickAddExpense, setShowQuickAddExpense] = useState(false);
  const [showQuickAddSavings, setShowQuickAddSavings] = useState(false);
  const isAdminUser = currentUser === "admin";

  useEffect(() => {
    // Migrate existing user data to new schema
    migrateUserData();
    
    // Create demo account on first load
    createDemoAccount();

    const darkModeEnabled = isDarkModeEnabled();
    setIsDarkMode(darkModeEnabled);
    document.documentElement.classList.toggle("dark", darkModeEnabled);
    
    const user = localStorage.getItem("expy_current_user");
    if (user) {
      // Update streak when app loads
      updateStreak(user);
      setCurrentUser(user);

      // Setup notification checking
      const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
      const userData = users[user];
      if (userData) {
        const intervalId = scheduleNotificationCheck(userData);
        
        // Cleanup on unmount
        return () => clearInterval(intervalId);
      }
    }
  }, []);

  useEffect(() => subscribeToColorMode((nextDarkMode) => setIsDarkMode(nextDarkMode)), []);

  useEffect(() => {
    if (!currentUser) return;

    void refreshUserCurrencyRatesIfNeeded(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setCurrentUserData(null);
      return;
    }

    const nextUserData = getStoredUsers()[currentUser] ?? createDefaultUserData(currentUser);
    setCurrentUserData(nextUserData);

    return subscribeToUserData(currentUser, (userData) => {
      setCurrentUserData(userData);
    });
  }, [currentUser]);

  useEffect(() => {
    applyAccentTheme(currentUserData?.preferences.themeAccentHex, isDarkMode);
  }, [currentUserData, isDarkMode]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const reconcilePremiumEntitlement = () => {
      const currentUserRecord = getStoredUsers()[currentUser];
      if (!currentUserRecord) {
        return;
      }

      const resolvedPlan = getResolvedUserPlan(currentUserRecord, listPaymentSubmissions());
      if (resolvedPlan !== currentUserRecord.plan) {
        saveUserData(currentUser, {
          ...currentUserRecord,
          plan: resolvedPlan,
        });
      }
    };

    reconcilePremiumEntitlement();
    return subscribeToPayments(() => {
      reconcilePremiumEntitlement();
    });
  }, [currentUser]);

  const updateStreak = (username: string) => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    const userData = users[username];
    
    if (!userData) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const lastOpened = userData.lastOpenedDate ? new Date(userData.lastOpenedDate) : null;
    if (lastOpened) {
      lastOpened.setHours(0, 0, 0, 0);
    }

    let newStreak = userData.currentStreak || 0;

    if (!lastOpened) {
      // First time opening the app
      newStreak = 1;
    } else {
      const lastOpenedTime = lastOpened.getTime();
      const todayTime = today.getTime();
      const daysDiff = Math.floor((todayTime - lastOpenedTime) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, keep streak
        newStreak = userData.currentStreak || 1;
      } else if (daysDiff === 1) {
        // Next day, increment streak
        newStreak = (userData.currentStreak || 0) + 1;
      } else {
        // More than 1 day gap, reset to 1
        newStreak = 1;
      }
    }

    // Update user data
    users[username] = {
      ...userData,
      currentStreak: newStreak,
      lastOpenedDate: todayStr,
    };
    localStorage.setItem("expy_users", JSON.stringify(users));
  };

  const handleLogin = (username: string) => {
    setShowWelcome(true);
    // Store the username temporarily, will be set after welcome animation
    setTimeout(() => {
      setCurrentUser(username);
      localStorage.setItem("expy_current_user", username);
      setShowWelcome(false);
    }, 1500);
  };

  const handleSignup = (username: string, password: string) => {
    setSecurityQuestionsUser({ username, password });
  };

  const handleGoogleAuth = (profile: GoogleProfile, mode: GoogleAuthMode) => {
    if (!profile.emailVerified) {
      toast.error("Google account email could not be verified.");
      return;
    }

    const users = getStoredUsers();
    const existingGoogleEntry = findUserEntryByGoogleId(users, profile.id);

    if (existingGoogleEntry) {
      const [existingUsername, existingUser] = existingGoogleEntry;

      if (existingUser.isActive === false) {
        users[existingUsername] = {
          ...existingUser,
          isActive: true,
        };
        writeStoredUsers(users);
      }

      handleLogin(existingUsername);
      return;
    }

    if (mode === "login") {
      toast.error("No EXPY account is linked to this Google account yet. Use Sign Up to create one.");
      return;
    }

    const usernameSeed = profile.email.split("@")[0] || profile.name || "googleuser";
    const nextUsername = createUniqueUsername(usernameSeed, users);

    users[nextUsername] = {
      ...createDefaultUserData(nextUsername),
      authProvider: "google",
      email: profile.email,
      googleId: profile.id,
      avatarUrl: profile.picture || "",
      displayName: profile.name,
    };
    writeStoredUsers(users);

    setOnboardingUser(nextUsername);
    toast.success("Google account connected");
  };

  const handleSecurityQuestionsComplete = () => {
    if (securityQuestionsUser) {
      setOnboardingUser(securityQuestionsUser.username);
      setSecurityQuestionsUser(null);
    }
  };

  const handleOnboardingComplete = () => {
    if (onboardingUser) {
      setShowWelcome(true);
      setTimeout(() => {
        setCurrentUser(onboardingUser);
        localStorage.setItem("expy_current_user", onboardingUser);
        setOnboardingUser(null);
        setShowWelcome(false);
      }, 1500);
    }
  };

  const handleWelcomeComplete = () => {
    // This will be handled by the setTimeout in handleLogin/handleOnboardingComplete
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("expy_current_user");
    setActiveTab("home");
    setMoreView("hub");
    setAccountsInitialSection("accounts");
    setActiveAccount({ kind: "main" });
  };

  const handleOpenWallet = (walletId: string | null) => {
    setActiveAccount(walletId ? { kind: "wallet", walletId } : { kind: "main" });
    setActiveTab("more");
    setMoreView("wallets");
  };

  const navigateToMore = (destination: MoreDestination) => {
    if ((destination === "admin-payments" || destination === "admin-support") && !isAdminUser) {
      setMoreView("hub");
      toast.error("Admin tools are only available from the admin account.");
      return;
    }

    setActiveTab("more");
    setMoreView(destination);
  };

  const openPremium = () => {
    navigateToMore("premium");
  };

  const openAccountsWorkspace = () => {
    setAccountsInitialSection("accounts");
    navigateToMore("accounts");
  };

  const openTransferWorkspace = () => {
    setAccountsInitialSection("transfers");
    navigateToMore("accounts");
  };

  const openWalletsWorkspace = () => {
    navigateToMore("wallets");
  };

  const openSettingsWorkspace = () => {
    navigateToMore("settings");
  };

  const quickHomeAccount = useMemo(() => (currentUserData ? getHomeDisplayAccount(currentUserData) : null), [currentUserData]);
  const quickPrimaryLabel = quickHomeAccount?.balanceModel === "credit" ? "Pay Card" : "Add Money";
  const quickExpenseDisabled = quickHomeAccount?.accountType === "savings_account";

  const handleQuickAddMoney = (amount: number, period: BudgetPeriod) => {
    if (!currentUser || !currentUserData || !quickHomeAccount) return;

    const amountInBaseCurrency = convertToBaseCurrency(amount, currentUserData.currencySettings);
    const timestamp = new Date().toISOString();
    const transactionType = quickHomeAccount.balanceModel === "credit" ? "credit_payment" : "add_money";
    const nextAccount = quickHomeAccount.balanceModel === "credit"
      ? {
          ...quickHomeAccount,
          usedCredit: Math.max(0, quickHomeAccount.usedCredit - amountInBaseCurrency),
          transactions: [
            {
              id: `${Date.now()}`,
              type: transactionType as const,
              amount: amountInBaseCurrency,
              date: timestamp,
              relatedAccountId: quickHomeAccount.id,
            },
            ...quickHomeAccount.transactions,
          ],
          updatedAt: timestamp,
        }
      : {
          ...quickHomeAccount,
          balance: quickHomeAccount.balance + amountInBaseCurrency,
          initialBalance: quickHomeAccount.initialBalance + amountInBaseCurrency,
          transactions: [
            {
              id: `${Date.now()}`,
              type: transactionType as const,
              amount: amountInBaseCurrency,
              date: timestamp,
              relatedAccountId: quickHomeAccount.id,
            },
            ...quickHomeAccount.transactions,
          ],
          updatedAt: timestamp,
        };

    saveUserData(currentUser, updateAccountInUserData({ ...currentUserData, budgetPeriod: period }, nextAccount));
    setShowQuickAddMoney(false);
  };

  const handleQuickAddExpense = (expense: Omit<Expense, "id" | "date">) => {
    if (!currentUser || !currentUserData || !quickHomeAccount || quickHomeAccount.accountType === "savings_account") return;

    const amountInBaseCurrency = convertToBaseCurrency(expense.amount, currentUserData.currencySettings);
    const timestamp = new Date().toISOString();
    const nextExpense = {
      ...expense,
      amount: amountInBaseCurrency,
      id: `${Date.now()}`,
      date: timestamp,
    };
    const nextAccount = {
      ...quickHomeAccount,
      balance: quickHomeAccount.balanceModel === "credit" ? quickHomeAccount.balance : quickHomeAccount.balance - amountInBaseCurrency,
      usedCredit: quickHomeAccount.balanceModel === "credit" ? quickHomeAccount.usedCredit + amountInBaseCurrency : quickHomeAccount.usedCredit,
      expenses: [nextExpense, ...quickHomeAccount.expenses],
      transactions: [
        {
          id: nextExpense.id,
          type: "expense" as const,
          amount: amountInBaseCurrency,
          category: expense.category,
          description: expense.description,
          date: timestamp,
          relatedAccountId: quickHomeAccount.id,
        },
        ...quickHomeAccount.transactions,
      ],
      updatedAt: timestamp,
    };

    saveUserData(currentUser, updateAccountInUserData(currentUserData, nextAccount));
    setShowQuickAddExpense(false);
  };

  const handleQuickAddSavings = (amount: number) => {
    if (!currentUser || !currentUserData || !quickHomeAccount) return;

    const amountInBaseCurrency = convertToBaseCurrency(amount, currentUserData.currencySettings);
    const timestamp = new Date().toISOString();
    const nextAccount = {
      ...quickHomeAccount,
      balance: quickHomeAccount.balanceModel === "credit" ? quickHomeAccount.balance : quickHomeAccount.balance - amountInBaseCurrency,
      usedCredit: quickHomeAccount.balanceModel === "credit" ? quickHomeAccount.usedCredit + amountInBaseCurrency : quickHomeAccount.usedCredit,
      transactions: [
        {
          id: `${Date.now()}`,
          type: "add_savings" as const,
          amount: amountInBaseCurrency,
          date: timestamp,
          relatedAccountId: quickHomeAccount.id,
        },
        ...quickHomeAccount.transactions,
      ],
      updatedAt: timestamp,
    };

    saveUserData(
      currentUser,
      updateAccountInUserData(
        {
          ...currentUserData,
          savings: currentUserData.savings + amountInBaseCurrency,
        },
        nextAccount,
      ),
    );
    setShowQuickAddSavings(false);
  };

  const quickActionItems = useMemo(() => {
    if (!currentUserData) {
      return [];
    }

    return currentUserData.preferences.quickActionIds
      .map((actionId) => {
        const option = QUICK_ACTION_OPTIONS.find((item) => item.id === actionId);
        if (!option) {
          return null;
        }

        switch (actionId) {
          case "add_expense":
            return {
              id: actionId,
              label: quickExpenseDisabled ? "Expense Off" : option.label,
              icon: option.icon,
              onSelect: () => setShowQuickAddExpense(true),
              disabled: Boolean(quickExpenseDisabled),
              variant: "default" as const,
            };
          case "add_money":
            return {
              id: actionId,
              label: quickPrimaryLabel,
              icon: option.icon,
              onSelect: () => setShowQuickAddMoney(true),
              variant: "outline" as const,
            };
          case "transfer":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: openTransferWorkspace,
              variant: "outline" as const,
            };
          case "add_savings":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: () => setShowQuickAddSavings(true),
              variant: "outline" as const,
            };
          case "open_savings":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: () => setActiveTab("savings"),
              variant: "outline" as const,
            };
          case "open_accounts":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: openAccountsWorkspace,
              variant: "outline" as const,
            };
          case "open_wallets":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: openWalletsWorkspace,
              variant: "outline" as const,
            };
          case "open_premium":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: openPremium,
              variant: "outline" as const,
            };
          case "open_settings":
            return {
              id: actionId,
              label: option.label,
              icon: option.icon,
              onSelect: openSettingsWorkspace,
              variant: "outline" as const,
            };
          case "toggle_theme":
            return {
              id: actionId,
              label: isDarkMode ? "Light Mode" : "Dark Mode",
              icon: option.icon,
              onSelect: () => applyColorMode(!isDarkMode),
              variant: "outline" as const,
            };
          default:
            return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [currentUserData, isDarkMode, openAccountsWorkspace, openPremium, openSettingsWorkspace, openTransferWorkspace, openWalletsWorkspace, quickExpenseDisabled, quickPrimaryLabel]);

  let screen: ReactNode;

  if (showWelcome) {
    screen = <WelcomeAnimation onComplete={handleWelcomeComplete} />;
  } else if (securityQuestionsUser) {
    screen = (
      <SecurityQuestionsSetup
        username={securityQuestionsUser.username}
        password={securityQuestionsUser.password}
        onComplete={handleSecurityQuestionsComplete}
      />
    );
  } else if (onboardingUser) {
    screen = <OnboardingScreen username={onboardingUser} onComplete={handleOnboardingComplete} />;
  } else if (!currentUser) {
    screen = <AuthScreen onLogin={handleLogin} onSignup={handleSignup} onGoogleAuth={handleGoogleAuth} />;
  } else {
    screen = (
      <div className="mobile-shell mobile-canvas">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background via-background/90 to-transparent" />

        <div className="relative flex-1 overflow-x-hidden overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          {activeTab === "home" && (
            <Dashboard username={currentUser} onOpenPremium={openPremium} />
          )}
          {activeTab === "history" && <ExpenseHistory username={currentUser} />}
          {activeTab === "savings" && <Savings username={currentUser} />}
          {activeTab === "more" &&
            (moreView === "hub" ? (
              <MoreHub onNavigate={navigateToMore} isAdmin={isAdminUser} />
            ) : moreView === "accounts" ? (
              <AccountsWorkspace username={currentUser} onBack={() => setMoreView("hub")} onOpenPremium={openPremium} initialSection={accountsInitialSection} />
            ) : moreView === "wallets" ? (
              <Wallets
                username={currentUser}
                activeAccount={activeAccount}
                onActiveAccountChange={setActiveAccount}
              />
            ) : moreView === "premium" ? (
              <PremiumPage username={currentUser} onBack={() => setMoreView("hub")} />
            ) : moreView === "contact" ? (
              <ContactUsPage username={currentUser} onBack={() => setMoreView("hub")} />
            ) : moreView === "settings" ? (
              <Settings
                username={currentUser}
                onLogout={handleLogout}
                activeAccount={activeAccount}
                onOpenWallet={handleOpenWallet}
              />
            ) : moreView === "admin-payments" && isAdminUser ? (
              <AdminPaymentsPage username={currentUser} onBack={() => setMoreView("hub")} />
            ) : moreView === "admin-support" && isAdminUser ? (
              <SupportInboxPage onBack={() => setMoreView("hub")} />
            ) : (
              <MoreHub onNavigate={navigateToMore} isAdmin={isAdminUser} />
            ))}
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] justify-start px-3 pr-[6.1rem] pb-[max(0.8rem,env(safe-area-inset-bottom))]">
          <nav className="floating-nav pointer-events-auto w-full rounded-[34px] px-2 py-2">
            <div className="grid grid-cols-4 gap-1">
              {APP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === "more") {
                        setActiveTab("more");
                        setMoreView("hub");
                        return;
                      }

                      setActiveTab(tab.id);
                    }}
                    className={`floating-nav-button ${isActive ? "floating-nav-button-active" : ""}`}
                  >
                    <Icon className={`h-[18px] w-[18px] transition-transform duration-200 ${isActive ? "scale-100" : "scale-[0.96] opacity-85"}`} />
                    <span className={`text-[11px] font-semibold tracking-[0.01em] transition-opacity duration-200 ${isActive ? "" : "opacity-80"}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {currentUserData && (
          <>
            <QuickActionFab
              items={quickActionItems}
            />
            <AddMoneyDialog
              open={showQuickAddMoney}
              onOpenChange={setShowQuickAddMoney}
              onAddMoney={handleQuickAddMoney}
              currencyCode={currentUserData.currencySettings.preferredCurrency}
              accountLabel={quickHomeAccount?.name || "Main Balance"}
              title={quickHomeAccount?.balanceModel === "credit" ? "Pay Card" : "Add Money"}
              description={quickHomeAccount?.balanceModel === "credit" ? `Reduce the outstanding amount on ${quickHomeAccount.name}.` : undefined}
              submitLabel={quickHomeAccount?.balanceModel === "credit" ? "Pay Card" : "Add Money"}
              showBudgetPeriod={quickHomeAccount?.balanceModel !== "credit"}
            />
            <AddExpenseDialog
              open={showQuickAddExpense}
              onOpenChange={setShowQuickAddExpense}
              onAddExpense={handleQuickAddExpense}
              currentBalance={quickHomeAccount?.balanceModel === "credit" ? Math.max((quickHomeAccount?.creditLimit || 0) - (quickHomeAccount?.usedCredit || 0), 0) : quickHomeAccount?.balance || 0}
              customCategories={currentUserData.customCategories}
              onManageCategories={openSettingsWorkspace}
              currencySettings={currentUserData.currencySettings}
              accountLabel={quickHomeAccount?.name || "Main Balance"}
              description={quickHomeAccount?.balanceModel === "credit" ? `Record a charge made using ${quickHomeAccount?.name}.` : undefined}
            />
            <AddSavingsDialog
              open={showQuickAddSavings}
              onOpenChange={setShowQuickAddSavings}
              onAddSavings={handleQuickAddSavings}
              currentBalance={quickHomeAccount?.balanceModel === "credit" ? Math.max((quickHomeAccount?.creditLimit || 0) - (quickHomeAccount?.usedCredit || 0), 0) : quickHomeAccount?.balance || 0}
              currencySettings={currentUserData.currencySettings}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<AppLoadingShell />}>{screen}</Suspense>
      <Toaster />
    </>
  );
}
