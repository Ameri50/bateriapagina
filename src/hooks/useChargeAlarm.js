import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadAlarmSettings,
  loadLastAlarm,
  playChime,
  requestNotificationPermission,
  saveAlarmSettings,
  saveLastAlarm,
  showSystemNotification,
} from "../lib/alarm";

const COOLDOWN = 30 * 60_000;
const REARM_LEVEL = 98;

export function useChargeAlarm({ level, charging, device }) {
  const [settings, setSettings] = useState(loadAlarmSettings);
  const [alert, setAlert] = useState(null);
  const [initialLastAlarm] = useState(() => loadLastAlarm(device.id));
  const armedRef = useRef(true);
  const lastRef = useRef(initialLastAlarm);

  useEffect(() => {
    saveAlarmSettings(settings);
  }, [settings]);

  const deviceAliasRef = useRef(device.alias);
  deviceAliasRef.current = device.alias;

  useEffect(() => {
    if (!settings.enabled) return;
    if (level == null || charging == null) return;

    if (!charging || level < 100) {
      if (level <= REARM_LEVEL) armedRef.current = true;
      return;
    }
    if (!armedRef.current) return;

    const now = Date.now();
    if (now - lastRef.current < COOLDOWN) {
      armedRef.current = false;
      return;
    }

    armedRef.current = false;
    lastRef.current = now;
    saveLastAlarm(device.id, now);
    setAlert({ at: now, alias: deviceAliasRef.current });

    if (settings.sound) playChime();
    if (settings.notifications) {
      showSystemNotification(
        "Batería al 100 %",
        `${deviceAliasRef.current} completó la carga. Desenchúfala para cuidar la batería.`,
      );
    }
  }, [level, charging, settings.enabled, settings.sound, settings.notifications, device.id]);

  const update = useCallback((patch) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const enableNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    if (permission === "granted") update({ notifications: true });
    return permission;
  }, [update]);

  const test = useCallback(() => {
    playChime();
    showSystemNotification("BatteryLink · alarma de prueba", "Así se verá el aviso cuando una batería llegue al 100 %.");
  }, []);

  const dismiss = useCallback(() => setAlert(null), []);

  return { settings, update, alert, dismiss, enableNotifications, test };
}
