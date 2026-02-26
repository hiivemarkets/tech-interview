import { useState, useEffect } from "react";

export function useCountdown(endsAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(
        0,
        Math.round((new Date(endsAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return secondsLeft;
}
