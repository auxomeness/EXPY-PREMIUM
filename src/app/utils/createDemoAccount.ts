import type { Account, Expense, Transaction, UserData } from "../App";
import { createDefaultCurrencySettings, createDefaultUserData } from "./userData";

const DEMO_USERNAME = "demouser";
const DEMO_ACCOUNT_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_ACCOUNT === "true";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "";

function buildDemoAccounts(timestamp: string): Account[] {
  return [
    {
      id: "demo-account-expy-main",
      name: "Expy",
      accountType: "cash",
      theme: "default",
      balanceModel: "standard",
      balance: 75000,
      initialBalance: 75000,
      includeInTotal: true,
      showOnHome: true,
      archived: false,
      creditLimit: 0,
      usedCredit: 0,
      expenses: [],
      transactions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "demo-account-bdo-debit",
      name: "BDO",
      accountType: "debit_card",
      theme: "bdo",
      balanceModel: "standard",
      balance: 100000,
      initialBalance: 100000,
      includeInTotal: true,
      showOnHome: true,
      archived: false,
      creditLimit: 0,
      usedCredit: 0,
      expenses: [],
      transactions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "demo-account-bpi-credit",
      name: "BPI",
      accountType: "credit_card",
      theme: "bpi",
      balanceModel: "credit",
      balance: 0,
      initialBalance: 0,
      includeInTotal: true,
      showOnHome: true,
      archived: false,
      creditLimit: 85000,
      usedCredit: 18250,
      expenses: [],
      transactions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "demo-account-goals-savings",
      name: "Goals",
      accountType: "savings_account",
      theme: "maya",
      balanceModel: "standard",
      balance: 45000,
      initialBalance: 45000,
      includeInTotal: true,
      showOnHome: true,
      archived: false,
      creditLimit: 0,
      usedCredit: 0,
      expenses: [],
      transactions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function buildDemoUserData(today: Date, expenses: Expense[], transactions: Transaction[]): UserData {
  const defaults = createDefaultUserData(DEMO_USERNAME, DEMO_PASSWORD);
  const timestamp = today.toISOString();
  const accounts = buildDemoAccounts(timestamp);

  return {
    ...defaults,
    displayName: "demo",
    balance: 75000,
    initialBalance: 75000,
    expenses,
    transactions,
    accounts,
    customCategories: ["Investments", "Health", "Education"],
    budgetAmount: 15000,
    currentStreak: 1095,
    lastOpenedDate: timestamp,
    savings: 30000,
    notificationsEnabled: true,
    dayEndTime: "23:59",
    lastNotificationDate: timestamp,
    securityQuestions: {
      nickname: "Demo",
      birthdate: "2000-01-01",
      favoriteColor: "Blue",
      secretCode: "1234",
    },
    currencySettings: createDefaultCurrencySettings("PHP"),
    preferences: {
      ...defaults.preferences,
      homeHeroMode: "selected_account",
      homeSelectedAccountId: accounts[0].id,
      homeHeroSwipeEnabled: true,
      homeHeroVisibleAccountIds: accounts.map((account) => account.id),
    },
  };
}

function shouldRefreshDemoAccounts(existingUser: UserData | undefined) {
  if (!existingUser) {
    return true;
  }

  const activeAccounts = Array.isArray(existingUser.accounts)
    ? existingUser.accounts.filter((account) => !account.archived)
    : [];

  if (activeAccounts.length === 0) {
    return true;
  }

  if (activeAccounts.length > 1) {
    return !activeAccounts.some((account) => account.id === "demo-account-expy-main" && account.name === "Expy" && account.accountType === "cash");
  }

  const [account] = activeAccounts;
  return account.balance === 0 && account.creditLimit === 0 && account.usedCredit === 0;
}

export function createDemoAccount() {
  const users = JSON.parse(localStorage.getItem("expy_users") || "{}");

  if (!DEMO_ACCOUNT_ENABLED || !DEMO_PASSWORD) {
    localStorage.setItem("expy_users", JSON.stringify(users));
    return null;
  }

  if (users[DEMO_USERNAME] && !shouldRefreshDemoAccounts(users[DEMO_USERNAME])) {
    localStorage.setItem("expy_users", JSON.stringify(users));
    return { username: DEMO_USERNAME, password: DEMO_PASSWORD };
  }

  const expenses: Expense[] = [];
  const today = new Date();

  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    expenses.push({
      id: `food-${i}`,
      amount: Math.floor(Math.random() * 300) + 50,
      category: "Food",
      description: ["Breakfast", "Lunch", "Dinner", "Snacks", "Coffee", "Grocery"][Math.floor(Math.random() * 6)],
      date: date.toISOString(),
    });
  }

  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    expenses.push({
      id: `transport-${i}`,
      amount: Math.floor(Math.random() * 200) + 50,
      category: "Transportation",
      description: ["Commute", "Taxi", "Gas", "Parking", "Grab"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }

  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    expenses.push({
      id: `shopping-${i}`,
      amount: Math.floor(Math.random() * 300) + 100,
      category: "Shopping",
      description: ["Clothes", "Gadgets", "Personal care", "Gifts", "Home items"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    expenses.push({
      id: `entertainment-${i}`,
      amount: Math.floor(Math.random() * 250) + 100,
      category: "Entertainment",
      description: ["Movies", "Concert", "Games", "Hobbies", "Sports"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }

  for (let i = 0; i < 12; i++) {
    const monthsAgo = i;
    const date = new Date(today);
    date.setMonth(date.getMonth() - monthsAgo);

    expenses.push({
      id: `bills-${i}`,
      amount: Math.floor(Math.random() * 500) + 1000,
      category: "Bills",
      description: ["Electricity", "Water", "Internet", "Phone", "Rent"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }

  const transactions: Transaction[] = expenses
    .map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    }))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  const demoUser = buildDemoUserData(today, expenses, transactions);

  users[DEMO_USERNAME] = demoUser;
  localStorage.setItem("expy_users", JSON.stringify(users));

  return { username: DEMO_USERNAME, password: DEMO_PASSWORD };
}
