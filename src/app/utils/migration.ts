import type { UserData } from "../App";
import { normalizeUserData } from "./userData";

/**
 * Migrates existing persisted user records to the latest schema.
 */
export function migrateUserData() {
  const rawUsers = JSON.parse(localStorage.getItem("expy_users") || "{}") as Record<string, Partial<UserData>>;
  let hasChanges = false;

  const nextUsers = Object.fromEntries(
    Object.entries(rawUsers).map(([username, user]) => {
      const normalizedUser = normalizeUserData({ username, ...user });

      if (JSON.stringify(user) !== JSON.stringify(normalizedUser)) {
        hasChanges = true;
      }

      return [username, normalizedUser];
    }),
  );

  if (hasChanges) {
    localStorage.setItem("expy_users", JSON.stringify(nextUsers));
  }
}
