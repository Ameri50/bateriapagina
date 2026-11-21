import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const HISTORY_KEY = "batterylink.web.history.v1";
const MAX_SAMPLES = 720;
const SYNC_INTERVAL = 90_000;
const HEARTBEAT_INTERVAL = 5 * 60_000;

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
      source: entry.source === "manual" ? "manual" : "sensor",
    });
  });
  return [...map.values()].sort((a, b) => a.t - b.t).slice(-MAX_SAMPLES);
}

function sameSamples(first, second) {
  if (first.length !== second.length) return false;
  if (first.length === 0) return true;
  const a = first[first.length - 1];
  const b = second[second.length - 1];
  return (
    a.t === b.t &&
    a.level === b.level &&
    a.charging === b.charging &&
    a.deviceId === b.deviceId &&
    a.source === b.source
  );
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
  const initializedRef = useRef(false);

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
        location: device.location ?? null,
        level: latest?.level ?? devicesRef.current[device.id]?.level ?? null,
        charging: latest?.charging ?? devicesRef.current[device.id]?.charging ?? null,
        source: latest?.source ?? devicesRef.current[device.id]?.source ?? null,
        updatedAt: latest?.t ?? Date.now(),
      };

      try {
        const userRef = doc(db, "users", user.uid);
        // Transacción: fusiona lo que ya haya escrito otro equipo para que
        // ninguno de los dos borre las baterías del otro.
        const result = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(userRef);
          const cloud = snapshot.data()?.battery ?? {};
          const cloudDevices = cloud.devices && typeof cloud.devices === "object" ? cloud.devices : {};
          const history = mergeSamples(cloud.history, payloadSamples);
          const devices = { ...cloudDevices, [device.id]: deviceEntry };
          transaction.set(
            userRef,
            { battery: { updatedAt: serverTimestamp(), history, devices } },
            { merge: true },
          );
          return { history, devices };
        });

        devicesRef.current = result.devices;
        setCloudDevices(result.devices);
        if (!sameSamples(samplesRef.current, result.history)) {
          samplesRef.current = result.history;
          setSamples(result.history);
        }
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

  // Al entrar con Google: escucha el documento de la cuenta para que los
  // equipos y lecturas de otros navegadores aparezcan sin recargar.
  useEffect(() => {
    if (!user) {
      initializedRef.current = false;
      devicesRef.current = {};
      setCloudDevices({});
      setSyncState("local");
      setSyncError("");
      lastSyncRef.current = 0;
      return undefined;
    }

    initializedRef.current = false;
    lastSyncRef.current = 0;
    setSyncState("syncing");
    setSyncError("");

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        const cloud = snapshot.data()?.battery ?? {};
        const cloudDevices = cloud.devices && typeof cloud.devices === "object" ? cloud.devices : {};
        const remoteHistory = normalize(cloud.history);

        devicesRef.current = cloudDevices;
        setCloudDevices(cloudDevices);

        if (remoteHistory.length > 0) {
          const merged = mergeSamples(samplesRef.current, remoteHistory);
          if (!sameSamples(samplesRef.current, merged)) {
            samplesRef.current = merged;
            setSamples(merged);
          }
        }

        if (snapshot.metadata.hasPendingWrites) {
          setSyncState("syncing");
          return;
        }

        if (!initializedRef.current) {
          initializedRef.current = true;
          lastSyncRef.current = 0;
          writerRef.current?.(samplesRef.current, true);
          return;
        }

        setSyncState("synced");
        setLastSync(Date.now());
      },
      (error) => {
        setSyncState("error");
        setSyncError(error?.message ?? "No se pudo leer el historial de tu cuenta.");
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  // Latido: el equipo sigue visible aunque su navegador no exponga batería.
  useEffect(() => {
    if (!user) return undefined;
    const timer = setInterval(() => writerRef.current?.(samplesRef.current, true), HEARTBEAT_INTERVAL);
    return () => clearInterval(timer);
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
    const normalized = { ...sample, source: sample.source === "manual" ? "manual" : "sensor" };
    setSamples((current) => {
      const last = current[current.length - 1];
      const duplicate =
        last &&
        last.deviceId === normalized.deviceId &&
        last.level === normalized.level &&
        last.charging === normalized.charging &&
        Math.abs(normalized.t - last.t) < 20_000;
      if (duplicate) return current;
      return [...current, normalized].slice(-MAX_SAMPLES);
    });
  }, []);

  // Lectura escrita a mano en equipos donde la web no puede leer la batería
  // (iPhone, iPad, Safari). Se guarda y se sincroniza como cualquier muestra.
  const reportManual = useCallback(
    async ({ level, charging }) => {
      const sample = {
        t: Date.now(),
        level: Math.max(0, Math.min(100, Math.round(Number(level)))),
        charging: Boolean(charging),
        deviceId: device.id,
        source: "manual",
      };
      const next = mergeSamples(samplesRef.current, [sample]);
      samplesRef.current = next;
      setSamples(next);
      await writerRef.current?.(next, true);
      return sample;
    },
    [device.id],
  );

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
      location: device.location ?? map[device.id]?.location ?? null,
      level: last?.level ?? map[device.id]?.level ?? null,
      charging: last?.charging ?? map[device.id]?.charging ?? null,
      source: last?.source ?? map[device.id]?.source ?? null,
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
    reportManual,
    clearHistory,
    syncNow,
  };
}
