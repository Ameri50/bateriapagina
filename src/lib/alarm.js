const ALARM_KEY = "batterylink.web.alarm.v1";
const LAST_KEY_PREFIX = "batterylink.web.alarm.last.";

const DEFAULTS = { enabled: true, sound: true, notifications: false };

let audioContext = null;

export function loadAlarmSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(ALARM_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return { ...DEFAULTS };
    return {
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : DEFAULTS.enabled,
      sound: typeof stored.sound === "boolean" ? stored.sound : DEFAULTS.sound,
      notifications:
        typeof stored.notifications === "boolean"
          ? stored.notifications && notificationsAvailable() && Notification.permission === "granted"
          : DEFAULTS.notifications,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAlarmSettings(settings) {
  try {
    localStorage.setItem(ALARM_KEY, JSON.stringify(settings));
  } catch {
    /* almacenamiento bloqueado */
  }
}

export function loadLastAlarm(deviceId) {
  try {
    return Number(localStorage.getItem(`${LAST_KEY_PREFIX}${deviceId}`)) || 0;
  } catch {
    return 0;
  }
}

export function saveLastAlarm(deviceId, timestamp) {
  try {
    localStorage.setItem(`${LAST_KEY_PREFIX}${deviceId}`, String(timestamp));
  } catch {
    /* almacenamiento bloqueado */
  }
}

export function notificationsAvailable() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  return notificationsAvailable() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission() {
  if (!notificationsAvailable()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "error";
  }
}

export function showSystemNotification(title, body) {
  if (!notificationsAvailable() || Notification.permission !== "granted") return false;
  try {
    new Notification(title, {
      body,
      tag: "batterylink-full-charge",
      icon: new URL("battery.svg", document.baseURI).href,
    });
    return true;
  } catch {
    return false;
  }
}

export function playChime() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return false;
  try {
    audioContext = audioContext ?? new AudioCtor();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    [880, 1174.66].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = now + index * 0.18;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.55);
    });
    return true;
  } catch {
    return false;
  }
}
