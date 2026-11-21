export const ACCENTS = [
  { id: "verde", label: "Verde", colors: ["#5ef2a0", "#22d3ee"] },
  { id: "azul", label: "Azul", colors: ["#60a5fa", "#38bdf8"] },
  { id: "violeta", label: "Violeta", colors: ["#a78bfa", "#f472b6"] },
  { id: "ambar", label: "Ámbar", colors: ["#fbbf24", "#fb923c"] },
  { id: "rosa", label: "Rosa", colors: ["#fb7185", "#f472b6"] },
  { id: "cian", label: "Cian", colors: ["#22d3ee", "#5ef2a0"] },
];

export const ACCENT_KEY = "batterylink.web.accent.v1";
export const THEME_KEY = "batterylink.web.theme.v1";

export function loadAccent() {
  const stored = localStorage.getItem(ACCENT_KEY);
  return ACCENTS.some((accent) => accent.id === stored) ? stored : "verde";
}

export function applyAccent(id) {
  document.documentElement.dataset.accent = id;
  localStorage.setItem(ACCENT_KEY, id);
}

export function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(THEME_KEY, id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", id === "light" ? "#f4f8f5" : "#070a09");
}
