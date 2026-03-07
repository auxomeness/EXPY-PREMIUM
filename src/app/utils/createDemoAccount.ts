import type { UserData, Expense } from "../App";

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
  
  const demoUser: UserData = {
    username: demoUsername,
    password: demoPassword,
    displayName: "demo",
    balance: 75000, // Good balance
    initialBalance: 75000,
    expenses: expenses,
    thresholdPercentage: 20,
    customCategories: ["Investments", "Health", "Education"],
    budgetPeriod: "monthly",
    budgetAmount: 15000, // ₱15,000 per month budget (₱180k/year vs ~₱79k spent = good discipline)
    lastBudgetReset: today.toISOString(),
    isActive: true,
    currentStreak: 1095, // 3 years streak (unlocks all streak badges)
    lastOpenedDate: today.toISOString(),
    savings: 30000, // ₱30,000 in savings (unlocks all savings badges)
    savingsLocked: false,
    notificationsEnabled: true,
    dayEndTime: "23:59",
    lastNotificationDate: today.toISOString(),
    securityQuestions: {
      nickname: "Demo",
      birthdate: "2000-01-01",
      favoriteColor: "Blue",
      secretCode: "1234"
    }
  };
  
  users[demoUsername] = demoUser;
  localStorage.setItem("expy_users", JSON.stringify(users));
  
  console.log("Demo account created successfully!");
  console.log("Username:", demoUsername);
  console.log("Password:", demoPassword);
  
  return { username: demoUsername, password: demoPassword };
}
