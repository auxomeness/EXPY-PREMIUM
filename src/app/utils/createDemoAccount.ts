import type { Expense, Transaction, UserData } from "../App";
import { createDefaultCurrencySettings, createDefaultUserData } from "./userData";

export function createDemoAccount() {
  const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
  
  // Demo username and password
  const demoUsername = "demouser";
  const demoPassword = "Demo@123";
  
  // Check if demo account already exists
  if (users[demoUsername]) {
    console.log("Demo account already exists");
    return { username: demoUsername, password: demoPassword };
  }
  
  // Generate expenses over the past year with good spending habits
  const expenses: Expense[] = [];
  const today = new Date();
  
  // Food category: ₱35,000 total (to unlock Category Master gold badge)
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    expenses.push({
      id: `food-${i}`,
      amount: Math.floor(Math.random() * 300) + 50, // ₱50-350
      category: "Food",
      description: ["Breakfast", "Lunch", "Dinner", "Snacks", "Coffee", "Grocery"][Math.floor(Math.random() * 6)],
      date: date.toISOString(),
    });
  }
  
  // Transportation: ₱12,000 total
  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    expenses.push({
      id: `transport-${i}`,
      amount: Math.floor(Math.random() * 200) + 50, // ₱50-250
      category: "Transportation",
      description: ["Commute", "Taxi", "Gas", "Parking", "Grab"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }
  
  // Shopping: ₱8,000 total
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    expenses.push({
      id: `shopping-${i}`,
      amount: Math.floor(Math.random() * 300) + 100, // ₱100-400
      category: "Shopping",
      description: ["Clothes", "Gadgets", "Personal care", "Gifts", "Home items"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }
  
  // Entertainment: ₱6,000 total
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    expenses.push({
      id: `entertainment-${i}`,
      amount: Math.floor(Math.random() * 250) + 100, // ₱100-350
      category: "Entertainment",
      description: ["Movies", "Concert", "Games", "Hobbies", "Sports"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }
  
  // Bills: ₱18,000 total
  for (let i = 0; i < 12; i++) {
    const monthsAgo = i;
    const date = new Date(today);
    date.setMonth(date.getMonth() - monthsAgo);
    
    expenses.push({
      id: `bills-${i}`,
      amount: Math.floor(Math.random() * 500) + 1000, // ₱1,000-1,500
      category: "Bills",
      description: ["Electricity", "Water", "Internet", "Phone", "Rent"][Math.floor(Math.random() * 5)],
      date: date.toISOString(),
    });
  }
  
  // Calculate date 1095 days ago (3 years for max streak)
  const streakStartDate = new Date(today);
  streakStartDate.setDate(streakStartDate.getDate() - 1095);
  
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

  const demoUser: UserData = {
    ...createDefaultUserData(demoUsername, demoPassword),
    displayName: "demo",
    balance: 75000,
    initialBalance: 75000,
    expenses,
    transactions,
    customCategories: ["Investments", "Health", "Education"],
    budgetAmount: 15000,
    currentStreak: 1095,
    lastOpenedDate: today.toISOString(),
    savings: 30000,
    notificationsEnabled: true,
    dayEndTime: "23:59",
    lastNotificationDate: today.toISOString(),
    securityQuestions: {
      nickname: "Demo",
      birthdate: "2000-01-01",
      favoriteColor: "Blue",
      secretCode: "1234",
    },
    currencySettings: createDefaultCurrencySettings("PHP"),
  };
  
  users[demoUsername] = demoUser;
  localStorage.setItem("expy_users", JSON.stringify(users));
  
  console.log("Demo account created successfully!");
  console.log("Username:", demoUsername);
  console.log("Password:", demoPassword);
  
  return { username: demoUsername, password: demoPassword };
}
