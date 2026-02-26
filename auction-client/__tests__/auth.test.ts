import { getCurrentUserId, setCurrentUserId } from "@/lib/auth";

afterEach(() => setCurrentUserId(null));

it("starts with no user", () => {
  expect(getCurrentUserId()).toBeNull();
});

it("stores and retrieves a user id", () => {
  setCurrentUserId("42");
  expect(getCurrentUserId()).toBe("42");
});

it("clears when set to null", () => {
  setCurrentUserId("42");
  setCurrentUserId(null);
  expect(getCurrentUserId()).toBeNull();
});
