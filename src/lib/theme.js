export const ACCENTS = [
  { id: "verde", label: "Verde", colors: ["#5ef2a0", "#22d3ee"] },
  { id: "azul", label: "Azul", colors: ["#60a5fa", "#38bdf8"] },
  { id: "violeta", label: "Violeta", colors: ["#a78bfa", "#f472b6"] },
  { id: "ambar", label: "Ámbar", colors: ["#fbbf24", "#fb923c"] },
  { id: "rosa", label: "Rosa", colors: ["#fb7185", "#f472b6"] },
  { id: "cian", label: "Cian", colors: ["#22d3ee", "#5ef2a0"] },
];

export const ACCENT_KEY = "batterylink.web.accent.v1";

export function loadAccent() {
  const stored = localStorage.getItem(ACCENT_KEY);
  return ACCENTS.some((accent) => accent.id === stored) ? stored : "verde";
}

export function applyAccent(id) {
  document.documentElement.dataset.accent = id;
  localStorage.setItem(ACCENT_KEY, id);
}
