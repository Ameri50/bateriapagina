const DEVICE_KEY = "batterylink.web.device.v1";
const ALIAS_KEY = "batterylink.web.alias.v1";
const COMPUTER_PLATFORMS = new Set(["Mac", "Windows", "Linux"]);

export function isComputer(entry) {
  return COMPUTER_PLATFORMS.has(entry?.platform);
}

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(navigator.platform) || /Mac OS X/.test(ua)) return "Mac";
  if (/Win/.test(navigator.platform)) return "Windows";
  if (/Linux/.test(navigator.platform)) return "Linux";
  return "Dispositivo";
}

export function detectModel() {
  const platform = detectPlatform();
  if (platform === "Mac") return "MacBook o iMac";
  if (platform === "iPhone") return "iPhone";
  if (platform === "iPad") return "iPad";
  if (platform === "Android") {
    const match = navigator.userAgent.match(/Android [\d.]+; ([^;)]+)/);
    return match?.[1]?.trim() || "Dispositivo Android";
  }
  if (platform === "Windows") return "PC con Windows";
  if (platform === "Linux") return "Equipo Linux";
  return "Este dispositivo";
}

export function detectBrowser() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari";
  return "Navegador";
}

export function loadDevice() {
  const storedId = localStorage.getItem(DEVICE_KEY) || readJSON(DEVICE_KEY);
  const id = typeof storedId === "string" && storedId ? storedId : newId();
  localStorage.setItem(DEVICE_KEY, id);

  const platform = detectPlatform();
  const alias = localStorage.getItem(ALIAS_KEY) || `Mi ${platform === "Mac" ? "Mac" : platform === "Dispositivo" ? "dispositivo" : platform}`;

  return {
    id,
    alias,
    platform,
    model: detectModel(),
    browser: detectBrowser(),
    cores: navigator.hardwareConcurrency || null,
    memoryGB: navigator.deviceMemory || null,
    screen: `${Math.round(window.screen.width)} × ${Math.round(window.screen.height)} pt`,
    pixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
  };
}

export function saveAlias(alias) {
  localStorage.setItem(ALIAS_KEY, alias);
}

export function mapUrl(location) {
  if (!location) return "";
  return `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=16/${location.lat}/${location.lng}`;
}
