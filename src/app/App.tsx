import { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { SecurityQuestionsSetup } from "./components/SecurityQuestionsSetup";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { WelcomeAnimation } from "./components/WelcomeAnimation";
import { Dashboard } from "./components/Dashboard";
import { ExpenseHistory } from "./components/ExpenseHistory";
import { Savings } from "./components/Savings";
import { Settings } from "./components/Settings";
import { Home, History, PiggyBank, SettingsIcon } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { migrateUserData } from "./utils/migration";
import { scheduleNotificationCheck } from "./utils/notifications";
import { createDemoAccount } from "./utils/createDemoAccount";

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

export type UserData = {
  username: string;
  password?: string;
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
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [onboardingUser, setOnboardingUser] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "history" | "savings" | "settings">("home");
  const [securityQuestionsUser, setSecurityQuestionsUser] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    // Migrate existing user data to new schema
    migrateUserData();
    
    // Create demo account on first load
    createDemoAccount();
    
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
  };

  if (showWelcome) {
    return (
      <>
        <WelcomeAnimation onComplete={handleWelcomeComplete} />
        <Toaster />
      </>
    );
  }

  if (securityQuestionsUser) {
    return (
      <>
        <SecurityQuestionsSetup 
          username={securityQuestionsUser.username}
          password={securityQuestionsUser.password}
          onComplete={handleSecurityQuestionsComplete}
        />
        <Toaster />
      </>
    );
  }

  if (onboardingUser) {
    return (
      <>
        <OnboardingScreen username={onboardingUser} onComplete={handleOnboardingComplete} />
        <Toaster />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        {/* Main Content */}
        <div className="flex-1 overflow-auto pb-20">
          {activeTab === "home" && <Dashboard username={currentUser} />}
          {activeTab === "history" && <ExpenseHistory username={currentUser} />}
          {activeTab === "savings" && <Savings username={currentUser} />}
          {activeTab === "settings" && <Settings username={currentUser} onLogout={handleLogout} />}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border">
          <div className="grid grid-cols-4 h-16">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === "home" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === "history" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </button>
            <button
              onClick={() => setActiveTab("savings")}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === "savings" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <PiggyBank className="w-5 h-5" />
              <span className="text-xs">Savings</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === "settings" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </nav>
      </div>
      <Toaster />
    </>
  );
}