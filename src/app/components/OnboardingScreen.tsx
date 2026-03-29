import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Sun, Moon, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { SupportedCurrency } from "../App";
import { SUPPORTED_CURRENCIES } from "../utils/currency";
import { createDefaultCurrencySettings } from "../utils/userData";

type OnboardingScreenProps = {
  username: string;
  onComplete: () => void;
};

export function OnboardingScreen({ username, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<SupportedCurrency>("PHP");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Check current theme
    const darkMode = localStorage.getItem("expy_dark_mode") === "true";
    setIsDarkMode(darkMode);

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    const existingDisplayName = users[username]?.displayName;

    if (existingDisplayName) {
      setDisplayName(existingDisplayName);
    }
  }, []);

  const handleDisplayNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].displayName = displayName.trim();
    localStorage.setItem("expy_users", JSON.stringify(users));
    
    setStep(2);
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const balanceAmount = parseFloat(balance);
    if (isNaN(balanceAmount) || balanceAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].balance = balanceAmount;
    users[username].initialBalance = balanceAmount;
    users[username].currencySettings = createDefaultCurrencySettings(currency);
    localStorage.setItem("expy_users", JSON.stringify(users));
    
    setStep(3);
  };

  const handleSkipBalance = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].currencySettings = createDefaultCurrencySettings(currency);
    localStorage.setItem("expy_users", JSON.stringify(users));
    setStep(3);
  };

  const handleThemeChoice = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
    localStorage.setItem("expy_dark_mode", darkMode.toString());
    
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleThemeSubmit = () => {
    setStep(4);
    
    // Show "You're All Set!" for 1.5 seconds
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const totalSteps = 4;
  const onboardingProgress = Math.min(((step - 1) / (totalSteps - 1)) * 100, 100);

  return (
    <div className="mobile-shell mobile-canvas justify-center px-5 py-8">
      <div className="mx-auto w-full max-w-sm space-y-5">
        {step < 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Getting Started</span>
              <span>Step {step} of {totalSteps - 1}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${onboardingProgress}%` }}
              />
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.24 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>What should we call you?</CardTitle>
                  <CardDescription>Choose a display name for your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Enter your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="h-12"
                        autoFocus
                      />
                    </div>
                    <Button type="submit" className="w-full h-12">
                      Continue
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.24 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Set your starting balance</CardTitle>
                  <CardDescription>How much money do you currently have?</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBalanceSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select value={currency} onValueChange={(value) => setCurrency(value as SupportedCurrency)}>
                        <SelectTrigger id="currency" className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {SUPPORTED_CURRENCIES.map((option) => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.code} • {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="balance">Balance ({currency})</Label>
                      <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        className="h-12"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 h-12">
                        Continue
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 h-12"
                        onClick={handleSkipBalance}
                      >
                        Skip for now
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.24 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Choose your theme</CardTitle>
                  <CardDescription>Select your preferred appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleThemeChoice(false)}
                      className={`relative rounded-[24px] border-2 p-6 transition-all ${
                        !isDarkMode 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Sun className="w-12 h-12 text-foreground" />
                        <span className="font-medium">Light</span>
                      </div>
                      {!isDarkMode && (
                        <motion.div
                          initial={reduceMotion ? false : { scale: 0.88, opacity: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: reduceMotion ? 0.12 : 0.18 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChoice(true)}
                      className={`relative rounded-[24px] border-2 p-6 transition-all ${
                        isDarkMode 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Moon className="w-12 h-12 text-foreground" />
                        <span className="font-medium">Dark</span>
                      </div>
                      {isDarkMode && (
                        <motion.div
                          initial={reduceMotion ? false : { scale: 0.88, opacity: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: reduceMotion ? 0.12 : 0.18 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      )}
                    </button>
                  </div>

                  <Button onClick={handleThemeSubmit} className="w-full h-12">
                    Continue
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-[0_22px_44px_-24px_rgba(3,2,19,0.95)]"
              >
                <Sparkles className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl text-center"
              >
                You're All Set!
              </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
