/**
 * Migrates existing user data to include new budget fields
 * This should be called when the app loads
 */
export function migrateUserData() {
  const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
  let hasChanges = false;

  Object.keys(users).forEach((username) => {
    const user = users[username];
    
    // Add budgetAmount if it doesn't exist
    if (user.budgetAmount === undefined) {
      user.budgetAmount = 0;
      hasChanges = true;
    }
    
    // Add lastBudgetReset if it doesn't exist
    if (!user.lastBudgetReset) {
      user.lastBudgetReset = new Date().toISOString();
      hasChanges = true;
    }
    
    // Add budgetPeriod if it doesn't exist
    if (!user.budgetPeriod) {
      user.budgetPeriod = "monthly";
      hasChanges = true;
    }
    
    // Add customCategories if it doesn't exist
    if (!user.customCategories) {
      user.customCategories = [];
      hasChanges = true;
    }

    // Add savings if it doesn't exist
    if (user.savings === undefined) {
      user.savings = 0;
      hasChanges = true;
    }

    // Add savingsLocked if it doesn't exist
    if (user.savingsLocked === undefined) {
      user.savingsLocked = false;
      hasChanges = true;
    }

    // Add notificationsEnabled if it doesn't exist
    if (user.notificationsEnabled === undefined) {
      user.notificationsEnabled = false;
      hasChanges = true;
    }

    // Add dayEndTime if it doesn't exist
    if (!user.dayEndTime) {
      user.dayEndTime = "22:00";
      hasChanges = true;
    }

    // Add lastNotificationDate if it doesn't exist
    if (!user.lastNotificationDate) {
      user.lastNotificationDate = "";
      hasChanges = true;
    }

    // Add securityQuestions if it doesn't exist
    if (!user.securityQuestions) {
      user.securityQuestions = {
        nickname: "",
        birthdate: "",
        favoriteColor: "",
        secretCode: "",
      };
      hasChanges = true;
    }

    // Add transactions if it doesn't exist
    if (!user.transactions) {
      user.transactions = [];
      hasChanges = true;
    }
  });

  if (hasChanges) {
    localStorage.setItem("expy_users", JSON.stringify(users));
  }
}