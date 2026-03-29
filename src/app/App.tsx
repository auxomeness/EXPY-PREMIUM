import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { Home, History, PiggyBank, SettingsIcon, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { WalletLoader } from "./components/WalletLoader";
import { migrateUserData } from "./utils/migration";
import { scheduleNotificationCheck } from "./utils/notifications";
import { createDemoAccount } from "./utils/createDemoAccount";
import { refreshUserCurrencyRatesIfNeeded } from "./utils/currency";
import { type GoogleProfile, type GoogleAuthMode } from "./utils/googleAuth";
import { createDefaultUserData, createUniqueUsername, findUserEntryByGoogleId, getStoredUsers, writeStoredUsers } from "./utils/userData";

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

export type Transaction = {
  id: string;
  type: "expense" | "add_money" | "add_savings" | "withdraw_savings";
  amount: number;
  category?: string; // Only for expenses
  description?: string; // Only for expenses
  date: string;
};

export type BudgetPeriod = "daily" | "weekly" | "monthly";

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
  archived: boolean;
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

export type UserData = {
  username: string;
  password?: string;
  authProvider: AuthProvider;
  email?: string;
  googleId?: string;
  avatarUrl?: string;
  displayName?: string;
  balance: number;
  initialBalance: number;
  expenses: Expense[];
  transactions: Transaction[]; // New comprehensive transaction history
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
  savingsWishlist: WishlistItem[];
};

const APP_TABS: Array<{
  id: "home" | "history" | "wallets" | "savings" | "settings";
  label: string;
  icon: LucideIcon;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: History },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "settings", label: "Settings", icon: SettingsIcon },
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
  const [activeTab, setActiveTab] = useState<"home" | "history" | "wallets" | "savings" | "settings">("home");
  const [securityQuestionsUser, setSecurityQuestionsUser] = useState<{ username: string; password: string } | null>(null);
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>({ kind: "main" });

  useEffect(() => {
    // Migrate existing user data to new schema
    migrateUserData();
    
    // Create demo account on first load
    createDemoAccount();

    const darkModeEnabled = localStorage.getItem("expy_dark_mode") === "true";
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

  useEffect(() => {
    if (!currentUser) return;

    void refreshUserCurrencyRatesIfNeeded(currentUser);
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
    setActiveAccount({ kind: "main" });
  };

  const handleOpenWallet = (walletId: string | null) => {
    setActiveAccount(walletId ? { kind: "wallet", walletId } : { kind: "main" });
    setActiveTab("wallets");
  };

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
            <Dashboard username={currentUser} />
          )}
          {activeTab === "history" && <ExpenseHistory username={currentUser} />}
          {activeTab === "wallets" && (
            <Wallets
              username={currentUser}
              activeAccount={activeAccount}
              onActiveAccountChange={setActiveAccount}
            />
          )}
          {activeTab === "savings" && <Savings username={currentUser} />}
          {activeTab === "settings" && (
            <Settings
              username={currentUser}
              onLogout={handleLogout}
              activeAccount={activeAccount}
              onOpenWallet={handleOpenWallet}
            />
          )}
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <nav className="pointer-events-auto w-full rounded-[28px] border border-border/70 bg-card/96 px-2 py-2 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.28)] dark:bg-card/94">
            <div className="grid grid-cols-5 gap-1">
              {APP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[22px] px-1.5 transition-all duration-200 active:scale-[0.985] ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_14px_28px_-20px_rgba(3,2,19,0.95)] ring-1 ring-primary-foreground/10"
                        : "text-muted-foreground/90 hover:bg-muted/60 hover:text-foreground"
                    }`}
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
