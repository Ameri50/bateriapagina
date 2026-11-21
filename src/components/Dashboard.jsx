import { useMemo } from "react";
import {
  Activity,
  BatteryLow,
  BatteryMedium,
  Cloud,
  CloudOff,
  Cpu,
  Gauge,
  HardDrive,
  History as HistoryIcon,
  Laptop,
  MemoryStick,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Thermometer,
  Zap,
} from "lucide-react";
import { BatteryRing } from "./BatteryRing";
import { TrendChart, summarize } from "./TrendChart";
import {
  ActionButton,
  Badge,
  GlassCard,
  InfoBanner,
  KeyValue,
  MiniBattery,
  SectionTitle,
} from "./ui";
import { GoogleMark } from "./Layout";
import { clockTime, duration, relativeTime } from "../lib/format";

function chargingLabel(charging, level, supported) {
  if (!supported) return "No disponible";
  if (charging == null || level == null) return "Leyendo batería";
  if (charging) return level >= 100 ? "Completa" : "Cargando";
  return "Descargando";
}

function PlaceholderMetric({ icon, title, subtitle, hint }) {
  return (
    <GlassCard className="metric-card">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <div className="metric-card__value">—</div>
      <p className="metric-card__hint">{hint}</p>
    </GlassCard>
  );
}

const ONLINE_WINDOW = 3 * 60_000;

function deviceIcon(entry) {
  const platform = entry.platform ?? "";
  return platform === "Mac" || platform === "Windows" || platform === "Linux" ? Laptop : Smartphone;
}

function deviceState(entry) {
  if (entry.level == null) {
    return entry.platform === "iPhone" || entry.platform === "iPad" ? "Safari no la expone" : "Sin lectura";
  }
  if (entry.charging) return entry.level >= 100 ? "Completa" : "Cargando";
  return "Descargando";
}

function deviceSnapshot(entry) {
  const level = entry.level == null ? null : Number(entry.level);
  const updatedAt = entry.updatedAt == null ? null : Number(entry.updatedAt);
  return {
    level: Number.isFinite(level) ? Math.max(0, Math.min(100, Math.round(level))) : null,
    charging: typeof entry.charging === "boolean" ? entry.charging : null,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : null,
  };
}

function DeviceRow({ entry, now }) {
  const Icon = deviceIcon(entry);
  const { level, charging, updatedAt } = deviceSnapshot(entry);
  const online = updatedAt != null && now - updatedAt < ONLINE_WINDOW;
  const state = deviceState({ ...entry, level, charging });
  return (
    <div className={`device-row ${entry.current ? "device-row--current" : ""}`}>
      <span className="device-row__icon">
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <div className="device-row__text">
        <strong>
          {entry.alias || entry.model || "Dispositivo"}
          {entry.current ? <span className="tag">Este</span> : null}
          {!entry.current && online ? <span className="tag tag--live">En vivo</span> : null}
        </strong>
        <span>{[entry.model, entry.browser].filter(Boolean).join(" · ") || entry.platform || "Sin datos"}</span>
      </div>
      <MiniBattery level={level} charging={charging} />
      <div className="device-row__meta">
        <strong>{level == null ? "—" : `${level} %`}</strong>
        <span>{state}</span>
        <span>{updatedAt ? relativeTime(updatedAt, now) : "sin lecturas"}</span>
      </div>
    </div>
  );
}

export function Dashboard({
  battery,
  device,
  user,
  samples,
  devices,
  syncState,
  syncNow,
  onSignIn,
  onNavigate,
  authBusy,
  now,
}) {
  const deviceSamples = useMemo(
    () => samples.filter((sample) => sample.deviceId === device.id),
    [samples, device.id],
  );
  const summary = summarize(deviceSamples);
  const label = chargingLabel(battery.charging, battery.level, battery.supported);

  const badges = (
    <>
      {battery.supported && battery.level != null ? (
        <Badge tone="good" icon={Activity}>
          En vivo
        </Badge>
      ) : (
        <Badge tone="warn" icon={BatteryLow}>
          Batería no expuesta
        </Badge>
      )}
      {battery.supported && battery.charging != null ? (
        <Badge tone={battery.charging ? "good" : "neutral"} icon={battery.charging ? Zap : BatteryMedium}>
          {battery.charging ? "Enchufado" : "Con batería"}
        </Badge>
      ) : null}
      {user ? (
        <Badge tone="blue" icon={Cloud}>
          Historial en tu cuenta
        </Badge>
      ) : null}
    </>
  );

  return (
    <>
      <GlassCard className="hero">
        <div className="hero__ring">
          <BatteryRing level={battery.level} charging={battery.charging} supported={battery.supported} />
        </div>
        <div className="hero__info">
          <div className="hero__head">
            <div>
              <span className="eyebrow">Nivel de batería</span>
              <h2>{label}</h2>
            </div>
            <div className="hero__badges">{badges}</div>
          </div>

          <div className="kv-grid">
            <KeyValue label="Dispositivo" value={device.alias} hint={`${device.model} · ${device.browser}`} />
            <KeyValue
              label="Para completar"
              value={battery.charging ? duration(battery.chargingTime) : "—"}
              hint={battery.charging ? "Estimación del navegador" : "Solo al cargar"}
            />
            <KeyValue
              label="Autonomía estimada"
              value={!battery.charging ? duration(battery.dischargingTime) : "—"}
              hint={!battery.charging ? "Estimación del navegador" : "Solo al descargar"}
            />
            <KeyValue
              label="Última lectura"
              value={relativeTime(battery.updatedAt, now)}
              hint={battery.updatedAt ? clockTime(battery.updatedAt) : "Sin datos"}
            />
          </div>

          <div className="hero__actions">
            <ActionButton icon={RefreshCw} onClick={syncNow} disabled={!user}>
              Guardar ahora
            </ActionButton>
            <ActionButton variant="ghost" icon={HistoryIcon} onClick={() => onNavigate("historial")}>
              Ver historial
            </ActionButton>
          </div>
        </div>
      </GlassCard>

      {!battery.supported ? (
        <InfoBanner
          icon={BatteryLow}
          title={
            device.platform === "iPhone" || device.platform === "iPad"
              ? `Este ${device.platform} no expone la batería a la web`
              : "Este navegador no expone la batería"
          }
          tone="warn"
        >
          {device.platform === "iPhone" || device.platform === "iPad" ? (
            <>
              Safari, Chrome y Firefox en iOS usan WebKit y no permiten leerla desde una página. El equipo queda
              registrado en «Tus baterías», pero su nivel solo puede leerlo la app nativa BatteryLink.
            </>
          ) : (
            <>
              Safari y Firefox no exponen la batería a las webs. En este equipo usa Chrome o Edge para verla aquí, o la
              app BatteryLink, que la lee del sistema. El historial ya guardado seguirá visible.
            </>
          )}
        </InfoBanner>
      ) : null}

      <div className="grid grid-3">
        <PlaceholderMetric
          icon={ShieldCheck}
          title="Salud de la batería"
          subtitle="Capacidad real frente a la de diseño."
          hint="El navegador no expone la salud. La app BatteryLink la lee del sistema en Mac e iPhone."
        />
        <PlaceholderMetric
          icon={Gauge}
          title="Ciclos"
          subtitle="Cargas completas acumuladas."
          hint="Solo disponible desde la app nativa, que consulta el controlador de batería."
        />
        <PlaceholderMetric
          icon={Thermometer}
          title="Temperatura"
          subtitle="Lectura del sensor."
          hint="La web no tiene acceso a los sensores térmicos del equipo."
        />
      </div>

      <div className="grid grid-2">
        <GlassCard>
          <SectionTitle
            icon={MonitorSmartphone}
            title="Especificaciones de este dispositivo"
            subtitle="Datos que el navegador sí entrega, sin inventar nada."
          />
          <div className="spec-list">
            <KeyValue label="Modelo" value={device.model} hint={device.platform} />
            <KeyValue label="Navegador" value={device.browser} />
            <KeyValue label="Pantalla" value={device.screen} hint={`Escala ${device.pixelRatio}×`} />
            <KeyValue label="Núcleos" value={device.cores ? `${device.cores}` : "No disponible"} />
            <KeyValue
              label="Memoria"
              value={device.memoryGB ? `≈ ${device.memoryGB} GB` : "No disponible"}
              hint={device.memoryGB ? "Valor aproximado del navegador" : undefined}
            />
            <KeyValue label="Idioma" value={device.language} />
          </div>
          <p className="note-line">
            <Cpu size={13} /> Puedes cambiar el nombre con el que aparece este equipo en Ajustes.
          </p>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            icon={Sparkles}
            title="Tus baterías"
            subtitle={
              user
                ? `${devices.length} ${devices.length === 1 ? "equipo" : "equipos"} con tu cuenta de Google.`
                : "Este navegador y los que agregues al entrar con Google."
            }
          />
          <div className="device-list">
            {devices.map((entry) => (
              <DeviceRow key={entry.id} entry={entry} now={now} />
            ))}
          </div>
          {user && devices.length <= 1 ? (
            <p className="note-line">
              <MonitorSmartphone size={13} /> Abre esta página en otro equipo con la misma cuenta (iPhone, otra laptop,
              Android) y aparecerá aquí con su propia batería.
            </p>
          ) : null}
          {!user ? (
            <button className="link-button" onClick={onSignIn} disabled={authBusy}>
              <GoogleMark />
              Entrar con Google para ver todos tus equipos
            </button>
          ) : null}
        </GlassCard>
      </div>

      <GlassCard>
        <SectionTitle
          icon={Activity}
          title="Tendencia · 7 días"
          subtitle="Promedio diario de tus muestras reales guardadas."
        />
        {deviceSamples.length >= 2 ? (
          <>
            <TrendChart samples={deviceSamples} range="7d" />
            <div className="trend-foot">
              <span>{summary?.count} muestras</span>
              <span>Promedio {summary?.average} %</span>
              <span>
                Mín. {summary?.min} % · Máx. {summary?.max} %
              </span>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">
              <Activity size={22} strokeWidth={2} />
            </span>
            <strong>Aún no hay suficientes muestras</strong>
            <p>
              Deja esta página abierta: cada minuto guardamos el nivel real de la batería.
              {user ? " Se sincroniza en tu cuenta de Google." : " Entra con Google para conservarlo entre visitas."}
            </p>
          </div>
        )}
      </GlassCard>

      {!user ? (
        <GlassCard className="signin-card">
          <div className="signin-card__icon">
            <GoogleMark />
          </div>
          <div className="signin-card__text">
            <h2>Hazlo tuyo con tu cuenta de Google</h2>
            <p>
              Inicia sesión con el proyecto de tesis para guardar tu historial, reconocer tus equipos y mantener tus
              baterías sincronizadas. Solo se guardan tus datos de batería en tu propio documento.
            </p>
          </div>
          <ActionButton onClick={onSignIn} disabled={authBusy}>
            {authBusy ? "Conectando…" : "Continuar con Google"}
          </ActionButton>
        </GlassCard>
      ) : null}

      <footer className="page-foot">
        <span>
          <CloudOff size={13} /> Datos reales del navegador. Nada simulado.
        </span>
        <span>
          <HardDrive size={13} /> Historial {syncState === "synced" ? "sincronizado" : "local"} · máx. 720 muestras
        </span>
        <span>
          <MemoryStick size={13} /> {samples.length} muestras guardadas
        </span>
      </footer>
    </>
  );
}
