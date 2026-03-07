import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { LogOut, Bell, Trash2, Moon, Sun, Tags, UserCircle, Lock, AtSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { LoadingScreen } from "./LoadingScreen";
import type { BudgetPeriod } from "../App";
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

type SettingsProps = {
  username: string;
  onLogout: () => void;
};

export function Settings({ username, onLogout }: SettingsProps) {
  const [thresholdPercentage, setThresholdPercentage] = useState("20");
  const [balance, setBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("monthly");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dayEndTime, setDayEndTime] = useState("22:00");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [dayEndTimeSaved, setDayEndTimeSaved] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [budgetAmountSaved, setBudgetAmountSaved] = useState(false);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  useEffect(() => {
    loadSettings();
    
    // Load dark mode preference
    const darkMode = localStorage.getItem("expy_dark_mode") === "true";
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    }

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [username]);

  const loadSettings = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    if (users[username]) {
      setThresholdPercentage(users[username].thresholdPercentage.toString());
      setBalance(users[username].balance || 0);
      setInitialBalance(users[username].initialBalance || 0);
      setCustomCategories(users[username].customCategories || []);
      setBudgetPeriod(users[username].budgetPeriod || "monthly");
      setBudgetAmount((users[username].budgetAmount || 0).toString());
      setDisplayName(users[username].displayName || "");
      setNotificationsEnabled(users[username].notificationsEnabled || false);
      setDayEndTime(users[username].dayEndTime || "22:00");
    }
  };

  const handleUpdateCategories = (categories: string[]) => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].customCategories = categories;
    localStorage.setItem("expy_users", JSON.stringify(users));
    setCustomCategories(categories);
  };

  const handleBudgetPeriodChange = (period: BudgetPeriod) => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].budgetPeriod = period;
    localStorage.setItem("expy_users", JSON.stringify(users));
    setBudgetPeriod(period);
    toast.success(`Budget period updated to ${period}`);
  };

  const saveThreshold = () => {
    const threshold = parseFloat(thresholdPercentage);
    
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      toast.error("Please enter a valid percentage (0-100)");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].thresholdPercentage = threshold;
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Threshold updated successfully");
    setThresholdSaved(true);
    
    setTimeout(() => {
      setThresholdSaved(false);
    }, 2000);
  };

  const saveBudgetAmount = () => {
    const amount = parseFloat(budgetAmount);
    
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].budgetAmount = amount;
    users[username].lastBudgetReset = new Date().toISOString();
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Auto budget amount updated successfully");
    setBudgetAmountSaved(true);
    
    setTimeout(() => {
      setBudgetAmountSaved(false);
    }, 2000);
  };

  const handleClearHistory = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].expenses = [];
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Expense history cleared");
    loadSettings();
  };

  const handleResetBalance = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].balance = 0;
    users[username].initialBalance = 0;
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Balance reset");
    loadSettings();
  };

  const thresholdAmount = (parseFloat(thresholdPercentage) / 100) * initialBalance;



  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("expy_dark_mode", newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    toast.success(`${newDarkMode ? "Dark" : "Light"} mode enabled`);
  };

  const handleDisplayNameChange = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].displayName = displayName.trim();
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Display name updated");
    setDisplayNameSaved(true);
    
    setTimeout(() => {
      setDisplayNameSaved(false);
    }, 2000);
    
    loadSettings();
  };

  const handleUsernameChange = () => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (newUsername.length > 10) {
      toast.error("Username must be 10 characters or less");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    
    if (users[newUsername]) {
      toast.error("Username already exists");
      return;
    }

    // Copy user data to new username
    users[newUsername] = { ...users[username] };
    delete users[username];
    
    localStorage.setItem("expy_users", JSON.stringify(users));
    localStorage.setItem("expy_current_user", newUsername);
    
    toast.success("Username changed successfully");
    
    // Show loading screen before reload
    setIsChangingUsername(true);
    
    // Reload the page after a short delay to show loading screen
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    
    if (users[username].password !== currentPassword) {
      toast.error("Current password is incorrect");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Check for at least one capital letter, one number, and one special character
    const hasCapital = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasCapital) {
      toast.error("Password must contain at least one capital letter");
      return;
    }

    if (!hasNumber) {
      toast.error("Password must contain at least one number");
      return;
    }

    if (!hasSpecial) {
      toast.error("Password must contain at least one special character");
      return;
    }

    users[username].password = newPassword;
    localStorage.setItem("expy_users", JSON.stringify(users));
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    toast.success("Password changed successfully");
    setPasswordSaved(true);
    
    setTimeout(() => {
      setPasswordSaved(false);
    }, 2000);
  };

  const handleDeactivateAccount = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].isActive = false;
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Account deactivated");
    onLogout();
  };

  const handleDeleteAccount = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    delete users[username];
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Account deleted permanently");
    onLogout();
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        toast.success("Notification permission granted");
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      toast.error("Failed to request notification permission");
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Enabling notifications
      if (notificationPermission !== "granted") {
        await requestNotificationPermission();
        if (Notification.permission !== "granted") {
          return;
        }
      }
      
      const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
      users[username].notificationsEnabled = true;
      users[username].dayEndTime = dayEndTime;
      localStorage.setItem("expy_users", JSON.stringify(users));
      setNotificationsEnabled(true);
      toast.success("Daily notifications enabled");
    } else {
      // Disabling notifications
      const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
      users[username].notificationsEnabled = false;
      localStorage.setItem("expy_users", JSON.stringify(users));
      setNotificationsEnabled(false);
      toast.success("Daily notifications disabled");
    }
  };

  const saveDayEndTime = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].dayEndTime = dayEndTime;
    localStorage.setItem("expy_users", JSON.stringify(users));
    toast.success("Day end time updated");
    setDayEndTimeSaved(true);
    
    // Reset the saved state after 2 seconds
    setTimeout(() => {
      setDayEndTimeSaved(false);
    }, 2000);
  };

  if (isChangingUsername) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1>Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how Expy looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            <Button onClick={toggleDarkMode} variant="outline">
              {isDarkMode ? "Disable" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>Manage your expense categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags className="w-5 h-5" />
              <div>
                <Label>Custom Categories</Label>
                <p className="text-sm text-muted-foreground">
                  {customCategories.length} custom {customCategories.length === 1 ? 'category' : 'categories'}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowManageCategories(true)} variant="outline">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              <Label htmlFor="display-name">Display Name</Label>
            </div>
            <FloatingLabelInput
              type="text"
              label="Display name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setDisplayNameSaved(false);
              }}
            />
            <Button 
              onClick={handleDisplayNameChange} 
              className="w-full h-12"
              variant={displayNameSaved ? "default" : "outline"}
            >
              {displayNameSaved ? "Saved" : "Save Display Name"}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will be shown instead of your username
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AtSign className="w-4 h-4" />
              <Label htmlFor="new-username">Change Username</Label>
            </div>
            <FloatingLabelInput
              type="text"
              label="New username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              maxLength={10}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!newUsername.trim()} className="w-full h-12">
                  Change Username
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Username?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your username will be changed from @{username} to @{newUsername}. You'll need to use the new username to log in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUsernameChange}>
                    Change Username
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <Label>Change Password</Label>
            </div>
            <FloatingLabelInput
              type="password"
              label="Current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordSaved(false);
              }}
            />
            <FloatingLabelInput
              type="password"
              label="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordSaved(false);
              }}
            />
            <FloatingLabelInput
              type="password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordSaved(false);
              }}
            />
            <div className="text-xs text-muted-foreground space-y-1 -mt-1">
              <p>Password requirements:</p>
              <p className="ml-2">• Min 6 characters</p>
              <p className="ml-2">• At least one capital letter</p>
              <p className="ml-2">• At least one number</p>
              <p className="ml-2">• At least one special character</p>
            </div>
            <Button 
              onClick={handlePasswordChange}
              className="w-full"
              disabled={!currentPassword || !newPassword || !confirmPassword}
              variant={passwordSaved ? "default" : "outline"}
            >
              {passwordSaved ? "Saved" : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">Username</Label>
            <p>@{username}</p>
          </div>
          {displayName && (
            <div>
              <Label className="text-sm text-muted-foreground">Display Name</Label>
              <p>{displayName}</p>
            </div>
          )}
          <Separator />
          <div>
            <Label className="text-sm text-muted-foreground">Current Balance</Label>
            <p className="text-xl">{formatCurrency(balance)}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Initial Balance</Label>
            <p>{formatCurrency(initialBalance)}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="budget-period">Budget Period</Label>
            <Select value={budgetPeriod} onValueChange={(value) => handleBudgetPeriodChange(value as BudgetPeriod)}>
              <SelectTrigger id="budget-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Budget</SelectItem>
                <SelectItem value="weekly">Weekly Budget</SelectItem>
                <SelectItem value="monthly">Monthly Budget</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {budgetPeriod === "daily" && "Your current balance is intended for one day"}
              {budgetPeriod === "weekly" && "Your current balance is intended for one week (7 days)"}
              {budgetPeriod === "monthly" && "Your current balance is intended for one month (30 days)"}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Auto Budget Amount</Label>
            <div className="flex gap-2">
              <Input
                id="budget-amount"
                type="number"
                placeholder="Enter amount"
                value={budgetAmount}
                onChange={(e) => {
                  setBudgetAmount(e.target.value);
                  setBudgetAmountSaved(false);
                }}
              />
              <Button 
                onClick={saveBudgetAmount}
                variant={budgetAmountSaved ? "default" : "outline"}
              >
                {budgetAmountSaved ? "Saved" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetPeriod === "daily" && "This amount will be added to your balance every day"}
              {budgetPeriod === "weekly" && "This amount will be added to your balance every week"}
              {budgetPeriod === "monthly" && "This amount will be added to your balance every month"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-2">
            <Bell className="w-5 h-5 mt-1" />
            <div className="flex-1">
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-base">Daily Reminder</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Get notified 1 hour before your day ends about your spending
              </p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">
                    {notificationsEnabled ? "Enabled" : "Disabled"}
                  </p>
                  {notificationPermission !== "granted" && !notificationsEnabled && (
                    <p className="text-xs text-muted-foreground">
                      Permission required
                    </p>
                  )}
                </div>
                <Button onClick={toggleNotifications} variant="outline">
                  {notificationsEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>

            {notificationsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="day-end-time">Day End Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="day-end-time"
                    type="time"
                    value={dayEndTime}
                    onChange={(e) => {
                      setDayEndTime(e.target.value);
                      setDayEndTimeSaved(false);
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={saveDayEndTime}
                    variant={dayEndTimeSaved ? "default" : "outline"}
                    className={dayEndTimeSaved ? "bg-primary text-primary-foreground" : ""}
                  >
                    {dayEndTimeSaved ? "Saved" : "Save"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll be notified 1 hour before {dayEndTime}
                </p>
              </div>
            )}
          </div>

          <Separator />

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
                onChange={(e) => {
                  setThresholdPercentage(e.target.value);
                  setThresholdSaved(false);
                }}
                className="flex-1"
              />
              <Button 
                onClick={saveThreshold}
                variant={thresholdSaved ? "default" : "outline"}
              >
                {thresholdSaved ? "Saved" : "Save"}
              </Button>
            </div>
            {initialBalance > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You'll be alerted when balance drops below
                </p>
                <p className="text-lg">{formatCurrency(thresholdAmount)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Expense History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your expense records. This action cannot be undone.
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
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Balance
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset your balance to {formatCurrency(0)}. This action cannot be undone.
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
                <Trash2 className="w-4 h-4 mr-2" />
                Deactivate Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Your Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account will be deactivated and you'll be logged out. You can reactivate by logging in again. Your data will be preserved.
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
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account Permanently
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data including expenses, balance, and settings. This action cannot be undone.
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
        </CardContent>
      </Card>

      <Button onClick={onLogout} variant="outline" className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>

      <ManageCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
        customCategories={customCategories}
        onUpdateCategories={handleUpdateCategories}
      />
    </div>
  );
}
