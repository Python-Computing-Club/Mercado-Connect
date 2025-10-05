import { useEffect, useRef } from "react";

export default function useCodigoTimer({ active, duration, onExpire, setTime, id = "default" }) {
  const timers = useRef({});

  useEffect(() => {
    if (!active || duration <= 0) return;

    setTime(duration, id);

    if (timers.current[id]) clearInterval(timers.current[id]);

    timers.current[id] = setInterval(() => {
      setTime((prev) => {
        const novoTempo = typeof prev === "object" ? prev[id] : prev;

        if (novoTempo <= 1) {
          clearInterval(timers.current[id]);
          onExpire(id);
          return typeof prev === "object" ? { ...prev, [id]: 0 } : 0;
        }

        return typeof prev === "object"
          ? { ...prev, [id]: novoTempo - 1 }
          : novoTempo - 1;
      }, id);
    }, 1000);

    const timerId = timers.current[id];
    return () => clearInterval(timerId);

  }, [active, duration, onExpire, setTime, id]);
}
