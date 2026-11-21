const timeFormatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short" });
const shortDayFormatter = new Intl.DateTimeFormat("es", { weekday: "short" });

export function percent(value) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)} %`;
}

export function compactNumber(value) {
  return new Intl.NumberFormat("es").format(value);
}

export function clockTime(timestamp) {
  if (!timestamp) return "—";
  return timeFormatter.format(new Date(timestamp));
}

export function dayLabel(timestamp) {
  if (!timestamp) return "—";
  return dayFormatter.format(new Date(timestamp));
}

export function shortDay(timestamp) {
  return shortDayFormatter.format(new Date(timestamp)).replace(".", "");
}

export function relativeTime(timestamp, now = Date.now()) {
  if (!timestamp) return "—";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 8) return "ahora";
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function duration(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return "menos de 1 min";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function gigabytes(bytes) {
  if (bytes == null) return "—";
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function firstName(user) {
  const source = user?.displayName?.trim();
  if (source) return source.split(/\s+/)[0];
  const email = user?.email;
  if (email) return email.split("@")[0];
  return null;
}

export function initials(user) {
  const name = user?.displayName?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  const email = user?.email?.[0];
  return email ? email.toUpperCase() : "B";
}

export function startOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function todayLabel() {
  return new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}
