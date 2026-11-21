const SESSION_GAP = 20 * 60_000;
const ACTIVE_WINDOW = 4 * 60_000;

export function chargeSessions(samples = [], now = Date.now()) {
  const sorted = [...samples].filter((sample) => Number.isFinite(Number(sample.t))).sort((a, b) => a.t - b.t);
  const sessions = [];
  let current = null;
  let last = null;

  sorted.forEach((sample) => {
    const t = Number(sample.t);
    last = sample;
    if (!sample.charging) {
      if (current && t - current.end > SESSION_GAP) {
        sessions.push(current);
        current = null;
      }
      return;
    }
    const level = Math.max(0, Math.min(100, Math.round(Number(sample.level))));
    if (current && t - current.end <= SESSION_GAP) {
      current.end = t;
      current.endLevel = level;
      current.samples += 1;
      return;
    }
    if (current) sessions.push(current);
    current = { start: t, end: t, startLevel: level, endLevel: level, samples: 1 };
  });

  if (current) sessions.push(current);

  const live = Boolean(last?.charging) && now - Number(last.t) < ACTIVE_WINDOW;

  return sessions
    .map((session, index) => ({
      ...session,
      duration: session.end - session.start,
      delta: session.endLevel - session.startLevel,
      complete: session.endLevel >= 100,
      active: live && index === sessions.length - 1,
    }))
    .sort((a, b) => b.end - a.end);
}
