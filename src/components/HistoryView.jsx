import { useEffect, useMemo, useState } from "react";
import { BatteryCharging, Cloud, CloudOff, CloudUpload, History as HistoryIcon, Smartphone } from "lucide-react";
import { TrendChart, summarize } from "./TrendChart";
import { ActionButton, Badge, GlassCard, InfoBanner, SectionTitle } from "./ui";
import { GoogleMark } from "./Layout";
import { clockTime, dayLabel, duration, relativeTime, startOfDay } from "../lib/format";
import { isComputer } from "../lib/device";
import { chargeSessions } from "../lib/charging";

const DAY = 24 * 60 * 60 * 1000;

function dailyGroups(samples) {
  const groups = new Map();
  samples.forEach((sample) => {
    const key = startOfDay(sample.t);
    const group = groups.get(key) ?? [];
    group.push(sample);
    groups.set(key, group);
  });
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, 7)
    .map(([day, group]) => {
      const summary = summarize(group);
      return {
        day,
        ...summary,
        charging: Math.round((group.filter((sample) => sample.charging).length / group.length) * 100),
      };
    });
}

function ChargeHistory({ sessions, alias }) {
  return (
    <GlassCard>
      <SectionTitle
        icon={BatteryCharging}
        title="Historial de recargas"
        subtitle={`Sesiones enchufadas detectadas en las muestras de ${alias}.`}
      />
      {sessions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">
            <BatteryCharging size={22} strokeWidth={2} />
          </span>
          <strong>Todavía no hay recargas registradas</strong>
          <p>Cuando este equipo se cargue con la página abierta, la sesión aparecerá aquí con su duración y niveles.</p>
        </div>
      ) : (
        <div className="charge-list">
          {sessions.slice(0, 8).map((session) => {
            const sameTime = session.start === session.end;
            return (
              <div className="charge-row" key={`${session.start}-${session.end}`}>
                <span className="charge-row__icon">
                  <BatteryCharging size={16} strokeWidth={2.1} />
                </span>
                <div className="charge-row__text">
                  <strong>
                    {dayLabel(session.start)} · {clockTime(session.start)}
                    {sameTime ? "" : `–${clockTime(session.end)}`}
                  </strong>
                  <span>
                    {session.duration > 0 ? duration(session.duration / 1000) : "1 muestra"} · {session.samples}{" "}
                    {session.samples === 1 ? "muestra" : "muestras"}
                  </span>
                </div>
                <div className="charge-row__numbers">
                  <strong>
                    {session.startLevel} % → {session.endLevel} %
                  </strong>
                  <span>{session.delta > 0 ? `+${session.delta}` : session.delta} puntos</span>
                </div>
                <Badge tone={session.active ? "good" : session.complete ? "blue" : "neutral"}>
                  {session.active ? "En curso" : session.complete ? "Completa" : "Parcial"}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
      {sessions.length > 8 ? (
        <p className="settings-note">Mostrando las 8 recargas más recientes de {sessions.length}.</p>
      ) : null}
    </GlassCard>
  );
}

export function HistoryView({
  samples,
  devices,
  device,
  user,
  syncState,
  syncError,
  lastSync,
  onSignIn,
  onSync,
  authBusy,
  now,
  mobile = false,
}) {
  const [range, setRange] = useState("7d");
  const options = useMemo(
    () => (mobile ? devices.filter((entry) => isComputer(entry)) : devices),
    [devices, mobile],
  );
  const [selectedDevice, setSelectedDevice] = useState(() => (mobile ? options[0]?.id ?? "" : device.id));

  useEffect(() => {
    if (!mobile) return;
    if (!options.some((entry) => entry.id === selectedDevice)) {
      setSelectedDevice(options[0]?.id ?? "");
    }
  }, [mobile, options, selectedDevice]);

  const selectedAlias = options.find((entry) => entry.id === selectedDevice)?.alias;
  const deviceSamples = useMemo(
    () => samples.filter((sample) => sample.deviceId === selectedDevice),
    [samples, selectedDevice],
  );
  const recent = useMemo(() => [...deviceSamples].reverse().slice(0, 10), [deviceSamples]);
  const groups = useMemo(() => dailyGroups(deviceSamples), [deviceSamples]);
  const weekSamples = useMemo(
    () => deviceSamples.filter((sample) => sample.t >= Date.now() - 7 * DAY),
    [deviceSamples],
  );
  const summary = summarize(weekSamples);
  const rangeSamples = useMemo(
    () => deviceSamples.filter((sample) => sample.t >= Date.now() - (range === "7d" ? 7 * DAY : DAY)),
    [deviceSamples, range],
  );
  const sessions = useMemo(() => chargeSessions(deviceSamples), [deviceSamples]);

  return (
    <>
      {!user ? (
        <GlassCard className="signin-card signin-card--flat">
          <div className="signin-card__icon">
            <GoogleMark />
          </div>
          <div className="signin-card__text">
            <h2>Guarda este historial en tu cuenta</h2>
            <p>
              Con tu cuenta de Google del proyecto de tesis, tus muestras se guardan en Firestore y aparecen en cualquier
              dispositivo donde entres. Sin sesión, el historial se queda solo en este navegador.
            </p>
          </div>
          <ActionButton onClick={onSignIn} disabled={authBusy}>
            {authBusy ? "Conectando…" : "Entrar con Google"}
          </ActionButton>
        </GlassCard>
      ) : null}

      {syncError ? (
        <InfoBanner icon={CloudOff} title="No se pudo sincronizar" tone="danger">
          {syncError}. Las muestras siguen guardadas en este navegador y se reintentará el guardado.
        </InfoBanner>
      ) : null}

      <div className="grid grid-4">
        <GlassCard className="stat">
          <span className="stat__label">Muestras (7 días)</span>
          <strong className="stat__value">{summary?.count ?? 0}</strong>
          <span className="stat__hint">
            {user ? (lastSync ? `${relativeTime(lastSync, now)} en la nube` : "Sin sincronizar todavía") : "Solo en este navegador"}
          </span>
        </GlassCard>
        <GlassCard className="stat">
          <span className="stat__label">Promedio</span>
          <strong className="stat__value">{summary ? `${summary.average} %` : "—"}</strong>
          <span className="stat__hint">Nivel medio real</span>
        </GlassCard>
        <GlassCard className="stat">
          <span className="stat__label">Máximo / mínimo</span>
          <strong className="stat__value">
            {summary ? `${summary.max} % · ${summary.min} %` : "—"}
          </strong>
          <span className="stat__hint">En la última semana</span>
        </GlassCard>
        <GlassCard className="stat">
          <span className="stat__label">Tiempo cargando</span>
          <strong className="stat__value">{summary ? `${summary.chargingShare} %` : "—"}</strong>
          <span className="stat__hint">Muestras enchufadas</span>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="chart-head">
          <SectionTitle
            icon={HistoryIcon}
            title="Evolución de tu batería"
            subtitle={`${selectedAlias ?? (mobile ? "Sin computadoras conectadas" : device.alias)} · muestras reales del navegador.`}
          />
          <div className="segmented">
            <button className={range === "24h" ? "segmented__item segmented__item--active" : "segmented__item"} onClick={() => setRange("24h")}>
              24 h
            </button>
            <button className={range === "7d" ? "segmented__item segmented__item--active" : "segmented__item"} onClick={() => setRange("7d")}>
              7 días
            </button>
          </div>
        </div>

        {options.length > 1 ? (
          <label className="select-row">
            <Smartphone size={15} />
            <select value={selectedDevice} onChange={(event) => setSelectedDevice(event.target.value)}>
              {options.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.alias || entry.model || entry.id}
                  {entry.current ? " (este)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {rangeSamples.length >= 2 ? (
          <TrendChart samples={rangeSamples} range={range} height={260} />
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">
              <HistoryIcon size={22} strokeWidth={2} />
            </span>
            <strong>{mobile && options.length === 0 ? "Sin computadoras conectadas" : "Sin muestras en este periodo"}</strong>
            <p>
              {mobile && options.length === 0
                ? "Abre esta página en tu Mac o laptop con la misma cuenta de Google para ver su historial aquí."
                : "Mantén la página abierta en un equipo con batería y vuelve más tarde. También puedes cambiar a 7 días."}
            </p>
          </div>
        )}
      </GlassCard>

      <ChargeHistory
        sessions={sessions}
        alias={selectedAlias ?? (mobile ? "las computadoras conectadas" : device.alias)}
      />

      <div className="grid grid-2">
        <GlassCard>
          <SectionTitle icon={Cloud} title="Resumen por día" subtitle="Calculado con tus propias lecturas." />
          {groups.length === 0 ? (
            <p className="muted-text">Todavía no hay días completos registrados.</p>
          ) : (
            <div className="day-list">
              {groups.map((group) => (
                <div className="day-row" key={group.day}>
                  <div className="day-row__date">
                    <strong>{dayLabel(group.day)}</strong>
                    <span>{group.count} muestras</span>
                  </div>
                  <div className="day-row__bar">
                    <span style={{ width: `${group.average}%` }} />
                  </div>
                  <div className="day-row__numbers">
                    <strong>{group.average} %</strong>
                    <span>
                      {group.min}–{group.max} %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle
            icon={HistoryIcon}
            title="Últimas lecturas"
            subtitle="Hora, nivel y estado en el momento de la muestra."
          />
          {recent.length === 0 ? (
            <p className="muted-text">Aún no hay lecturas guardadas.</p>
          ) : (
            <div className="reading-list">
              {recent.map((sample) => (
                <div className="reading-row" key={`${sample.deviceId}-${sample.t}`}>
                  <span className="reading-row__time">{clockTime(sample.t)}</span>
                  <span className="reading-row__date">{dayLabel(sample.t)}</span>
                  <Badge tone={sample.charging ? "good" : "neutral"}>{sample.charging ? "Cargando" : "Batería"}</Badge>
                  <strong className="reading-row__level">{sample.level} %</strong>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="history-actions">
        <ActionButton icon={CloudUpload} onClick={onSync} disabled={!user}>
          Sincronizar ahora
        </ActionButton>
        <span className="muted-text">
          {user
            ? `Guardado en users/${user.uid.slice(0, 6)}… de Firestore · ${syncState === "synced" ? "al día" : syncState === "syncing" ? "sincronizando" : "pendiente"}`
            : "Sin sesión: historial local de este navegador"}
        </span>
      </div>
    </>
  );
}
