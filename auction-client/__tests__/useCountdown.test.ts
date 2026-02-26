import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "@/hooks/useCountdown";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("returns null when endsAt is null", () => {
  const { result } = renderHook(() => useCountdown(null));
  expect(result.current).toBeNull();
});

it("returns seconds remaining until endsAt", () => {
  const endsAt = new Date(Date.now() + 15_000).toISOString();
  const { result } = renderHook(() => useCountdown(endsAt));
  expect(result.current).toBe(15);
});

it("counts down each second", () => {
  const endsAt = new Date(Date.now() + 10_000).toISOString();
  const { result } = renderHook(() => useCountdown(endsAt));
  expect(result.current).toBe(10);

  act(() => jest.advanceTimersByTime(3000));
  expect(result.current).toBe(7);
});

it("clamps to zero when past endsAt", () => {
  const endsAt = new Date(Date.now() - 5_000).toISOString();
  const { result } = renderHook(() => useCountdown(endsAt));
  expect(result.current).toBe(0);
});

it("resets when endsAt changes to null", () => {
  const endsAt = new Date(Date.now() + 20_000).toISOString();
  const { result, rerender } = renderHook(
    ({ value }) => useCountdown(value),
    { initialProps: { value: endsAt as string | null } }
  );
  expect(result.current).toBe(20);

  rerender({ value: null });
  expect(result.current).toBeNull();
});

it("clears interval on unmount", () => {
  const endsAt = new Date(Date.now() + 30_000).toISOString();
  const { unmount } = renderHook(() => useCountdown(endsAt));
  const clearSpy = jest.spyOn(global, "clearInterval");

  unmount();
  expect(clearSpy).toHaveBeenCalled();
  clearSpy.mockRestore();
});
