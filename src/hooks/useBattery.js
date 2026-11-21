import { useEffect, useRef, useState } from "react";

const initialState = {
  supported: null,
  level: null,
  charging: null,
  chargingTime: null,
  dischargingTime: null,
  updatedAt: null,
};

function read(manager) {
  return {
    supported: true,
    level: typeof manager.level === "number" ? Math.round(manager.level * 100) : null,
    charging: typeof manager.charging === "boolean" ? manager.charging : null,
    chargingTime:
      manager.charging && Number.isFinite(manager.chargingTime) && manager.chargingTime > 0
        ? manager.chargingTime
        : null,
    dischargingTime:
      !manager.charging && Number.isFinite(manager.dischargingTime) && manager.dischargingTime > 0
        ? manager.dischargingTime
        : null,
    updatedAt: Date.now(),
  };
}

export function useBattery() {
  const [state, setState] = useState(initialState);
  const cleanupRef = useRef(() => {});

  useEffect(() => {
    let active = true;

    if (typeof navigator === "undefined" || typeof navigator.getBattery !== "function") {
      setState((current) => ({ ...current, supported: false }));
      return undefined;
    }

    navigator
      .getBattery()
      .then((manager) => {
        if (!active) return;
        const update = () => {
          if (active) setState(read(manager));
        };
        update();
        const events = ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"];
        events.forEach((event) => manager.addEventListener(event, update));
        cleanupRef.current = () => {
          events.forEach((event) => manager.removeEventListener(event, update));
        };
      })
      .catch(() => {
        if (active) setState((current) => ({ ...current, supported: false }));
      });

    return () => {
      active = false;
      cleanupRef.current();
    };
  }, []);

  return state;
}
