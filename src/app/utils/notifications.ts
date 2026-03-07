import type { UserData } from "../App";

export function checkAndSendDailyNotification(userData: UserData) {
  // Check if notifications are enabled
  if (!userData.notificationsEnabled) {
    return;
  }

  // Check if browser supports notifications
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  // Get current date and time
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];

  // Check if we already sent a notification today
  if (userData.lastNotificationDate === currentDate) {
    return;
  }

  // Parse day end time
  const [hours, minutes] = userData.dayEndTime.split(":").map(Number);
  
  // Calculate notification time (1 hour before day end)
  const dayEndDate = new Date();
  dayEndDate.setHours(hours, minutes, 0, 0);
  
  const notificationTime = new Date(dayEndDate);
  notificationTime.setHours(notificationTime.getHours() - 1);

  // Check if current time is past notification time and before day end
  if (now >= notificationTime && now < dayEndDate) {
    sendDailyNotification(userData);
  }
}

function sendDailyNotification(userData: UserData) {
  const currentDate = new Date().toISOString().split("T")[0];

  // Calculate daily budget based on budget period
  let dailyBudget = 0;
  if (userData.budgetPeriod === "daily") {
    dailyBudget = userData.budgetAmount;
  } else if (userData.budgetPeriod === "weekly") {
    dailyBudget = userData.budgetAmount / 7;
  } else if (userData.budgetPeriod === "monthly") {
    dailyBudget = userData.budgetAmount / 30;
  }

  // Get today's expenses
  const todayExpenses = userData.expenses.filter(expense => {
    const expenseDate = new Date(expense.date).toISOString().split("T")[0];
    return expenseDate === currentDate;
  });

  const todaySpent = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingForDay = dailyBudget - todaySpent;

  let title = "";
  let body = "";
  let icon = "💰";

  if (remainingForDay > 0) {
    // User has money left
    title = "Money Left Today!";
    body = `You still have ₱${remainingForDay.toFixed(2)} left for the day. Move to savings or recompute daily balance?`;
    icon = "💵";
  } else if (remainingForDay < 0) {
    // User overspent
    title = "Overspent Today";
    body = "You overspent today. Please manage your money wisely, don't overspend.";
    icon = "⚠️";
  } else {
    // Exact budget used
    title = "Perfect Balance!";
    body = "You've used exactly your daily budget. Great job!";
    icon = "✅";
  }

  // Send notification
  try {
    new Notification(title, {
      body: body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "expy-daily-reminder",
      requireInteraction: false,
    });

    // Update last notification date
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    if (users[userData.username]) {
      users[userData.username].lastNotificationDate = currentDate;
      localStorage.setItem("expy_users", JSON.stringify(users));
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export function scheduleNotificationCheck(userData: UserData) {
  // Check immediately
  checkAndSendDailyNotification(userData);

  // Check every 5 minutes
  const intervalId = setInterval(() => {
    checkAndSendDailyNotification(userData);
  }, 5 * 60 * 1000); // 5 minutes

  return intervalId;
}
