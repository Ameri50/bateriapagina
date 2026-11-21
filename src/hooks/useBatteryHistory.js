import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const HISTORY_KEY = "batterylink.web.history.v1";
const MAX_SAMPLES = 720;
const SYNC_INTERVAL = 90_000;

function normalize(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(
    (entry) =>
      entry &&
      Number.isFinite(Number(entry.t)) &&
      Number.isFinite(Number(entry.level)) &&
      typeof entry.deviceId === "string",
  );
}

function loadLocal() {
  try {
    return normalize(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")).slice(-MAX_SAMPLES);
  } catch {
    return [];
  }
}

function mergeSamples(first, second) {
  const map = new Map();
  [...first, ...normalize(second)].forEach((entry) => {
    const t = Number(entry.t);
    const level = Math.max(0, Math.min(100, Math.round(Number(entry.level))));
    const deviceId = entry.deviceId || "desconocido";
    map.set(`${deviceId}:${t}`, {
      t,
      level,
      charging: Boolean(entry.charging),
      deviceId,
    });
  });
  return [...map.values()].sort((a, b) => a.t - b.t).slice(-MAX_SAMPLES);
}

export function useBatteryHistory({ user, device }) {
  const [samples, setSamples] = useState(loadLocal);
  const [cloudDevices, setCloudDevices] = useState({});
  const [syncState, setSyncState] = useState(user ? "syncing" : "local");
  const [syncError, setSyncError] = useState("");
  const [lastSync, setLastSync] = useState(null);

  const samplesRef = useRef(samples);
  const devicesRef = useRef(cloudDevices);
  const lastSyncRef = useRef(0);
  const writerRef = useRef(null);

  useEffect(() => {
    samplesRef.current = samples;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(samples));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [samples]);

  useEffect(() => {
    devicesRef.current = cloudDevices;
  }, [cloudDevices]);

  const writeCloud = useCallback(
    async (payloadSamples, force = false) => {
      if (!user) return;
      const now = Date.now();
      if (!force && now - lastSyncRef.current < SYNC_INTERVAL) return;
      lastSyncRef.current = now;
      setSyncState("syncing");

      const currentDeviceSamples = payloadSamples.filter((sample) => sample.deviceId === device.id);
      const latest = currentDeviceSamples[currentDeviceSamples.length - 1];
      const deviceEntry = {
        alias: device.alias,
        model: device.model,
        platform: device.platform,
        browser: device.browser,
        cores: device.cores,
        memoryGB: device.memoryGB,
        screen: device.screen,
        level: latest?.level ?? devicesRef.current[device.id]?.level ?? null,
        charging: latest?.charging ?? devicesRef.current[device.id]?.charging ?? null,
        updatedAt: latest?.t ?? Date.now(),
      };
      const devices = { ...devicesRef.current, [device.id]: deviceEntry };

      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            battery: {
              updatedAt: serverTimestamp(),
              history: payloadSamples.slice(-MAX_SAMPLES),
              devices,
            },
          },
          { merge: true },
        );
        devicesRef.current = devices;
        setCloudDevices(devices);
        setLastSync(Date.now());
        setSyncError("");
        setSyncState("synced");
      } catch (error) {
        setSyncState("error");
        setSyncError(error?.message ?? "No se pudo guardar el historial.");
      }
    },
    [user, device],
  );

  writerRef.current = writeCloud;

  // Al entrar con Google: fusionar lo local con lo guardado en la cuenta.
  useEffect(() => {
    if (!user) {
      setCloudDevices({});
      setSyncState("local");
      setSyncError("");
      lastSyncRef.current = 0;
      return undefined;
    }

    let cancelled = false;
    setSyncState("syncing");
    setSyncError("");

    (async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        const cloud = snapshot.data()?.battery ?? {};
        const merged = mergeSamples(samplesRef.current, cloud.history);
        const devices = cloud.devices && typeof cloud.devices === "object" ? cloud.devices : {};
        devicesRef.current = devices;
        setCloudDevices(devices);
        samplesRef.current = merged;
        setSamples(merged);
        lastSyncRef.current = 0;
        await writerRef.current(merged, true);
      } catch (error) {
        if (!cancelled) {
          setSyncState("error");
          setSyncError(error?.message ?? "No se pudo leer el historial de tu cuenta.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Guardado periódico mientras haya muestras nuevas.
  useEffect(() => {
    if (!user || syncState === "local") return undefined;
    if (Date.now() - lastSyncRef.current < SYNC_INTERVAL) return undefined;
    const timer = setTimeout(() => writerRef.current(samplesRef.current), 4000);
    return () => clearTimeout(timer);
  }, [samples, user, syncState]);

  // Guardar al salir de la pestaña y cuando cambia el nombre del dispositivo.
  useEffect(() => {
    if (!user) return undefined;
    const flush = () => {
      if (document.visibilityState === "hidden") {
        writerRef.current(samplesRef.current, true);
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [user, device.alias]);

  useEffect(() => {
    if (!user) return undefined;
    lastSyncRef.current = 0;
    const timer = setTimeout(() => writerRef.current(samplesRef.current, true), 1500);
    return () => clearTimeout(timer);
  }, [user, device.alias]);

  const addSample = useCallback((sample) => {
    setSamples((current) => {
      const last = current[current.length - 1];
      const duplicate =
        last &&
        last.deviceId === sample.deviceId &&
        last.level === sample.level &&
        last.charging === sample.charging &&
        Math.abs(sample.t - last.t) < 20_000;
      if (duplicate) return current;
      return [...current, sample].slice(-MAX_SAMPLES);
    });
  }, []);

  const syncNow = useCallback(() => writerRef.current(samplesRef.current, true), []);

  const clearHistory = useCallback(async () => {
    setSamples([]);
    samplesRef.current = [];
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignorar */
    }
    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { battery: { updatedAt: serverTimestamp(), history: [] } },
          { merge: true },
        );
        setLastSync(Date.now());
      } catch (error) {
        setSyncError(error?.message ?? "No se pudo borrar el historial de la cuenta.");
      }
    }
  }, [user]);

  const devices = useMemo(() => {
    const map = { ...cloudDevices };
    const last = [...samples].reverse().find((sample) => sample.deviceId === device.id);
    map[device.id] = {
      ...(map[device.id] ?? {}),
      alias: device.alias,
      model: device.model,
      platform: device.platform,
      browser: device.browser,
      level: last?.level ?? map[device.id]?.level ?? null,
      charging: last?.charging ?? map[device.id]?.charging ?? null,
      updatedAt: last?.t ?? map[device.id]?.updatedAt ?? null,
      current: true,
    };
    return Object.entries(map)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => Number(b.current ?? false) - Number(a.current ?? false) || (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [cloudDevices, device, samples]);

  return {
    samples,
    devices,
    syncState,
    syncError,
    lastSync,
    addSample,
    clearHistory,
    syncNow,
  };
}
