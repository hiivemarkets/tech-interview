import { getCurrentUserId, setCurrentUser, getStoredUser } from "@/lib/auth";

afterEach(() => {
  setCurrentUser(null);
  sessionStorage.clear();
});

it("starts with no user", () => {
  expect(getCurrentUserId()).toBeNull();
  expect(getStoredUser()).toBeNull();
});

it("stores and retrieves a user", () => {
  setCurrentUser({ id: "42", name: "Alice" });
  expect(getCurrentUserId()).toBe("42");
  expect(getStoredUser()).toEqual({ id: "42", name: "Alice" });
});

it("clears when set to null", () => {
  setCurrentUser({ id: "42", name: "Alice" });
  setCurrentUser(null);
  expect(getCurrentUserId()).toBeNull();
  expect(getStoredUser()).toBeNull();
});

it("persists across reads from sessionStorage", () => {
  setCurrentUser({ id: "7", name: "Bob" });
  const restored = getStoredUser();
  expect(restored).toEqual({ id: "7", name: "Bob" });
  expect(getCurrentUserId()).toBe("7");
});
