import { useEffect } from "react";

export default function useCodigoTimer({ active, duration, onExpire, setTime }) {
  useEffect(() => {
    if (!active || duration <= 0) return;

    setTime(duration);

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active, duration, onExpire, setTime]);
}