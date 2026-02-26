import type { User } from "./generated/graphql";

const STORAGE_KEY = "auction_current_user";

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string | null {
  return getStoredUser()?.id ?? null;
}
