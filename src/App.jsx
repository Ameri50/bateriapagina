import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Cloud, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useBattery } from "./hooks/useBattery";
import { useBatteryHistory } from "./hooks/useBatteryHistory";
import { loadDevice, saveAlias } from "./lib/device";
import { applyAccent, loadAccent } from "./lib/theme";
import { firstName, todayLabel } from "./lib/format";
import { DeviceChip, MobileBrand, MobileNav, PageHeader, Sidebar } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { HistoryView } from "./components/HistoryView";
import { SettingsView } from "./components/SettingsView";
import { ActionButton, Badge, InfoBanner } from "./components/ui";

const PAGE_META = {
  inicio: {
    eyebrow: todayLabel(),
    title: (user) => (firstName(user) ? `Hola, ${firstName(user)}` : "Tu batería, sin adivinar"),
    subtitle: "Nivel, tendencia e historial real de este dispositivo. Sin datos inventados.",
  },
  historial: {
    eyebrow: "Tus datos",
    title: () => "Historial de batería",
    subtitle:
      "Muestras reales guardadas por equipo. Con tu cuenta de Google, el historial te acompaña entre dispositivos.",
  },
  ajustes: {
    eyebrow: "Personaliza",
    title: () => "Ajustes",
    subtitle: "Cuenta, nombre del equipo, color y todo lo que se guarda.",
  },
};

export default function App() {
  const [baseDevice] = useState(loadDevice);
  const [alias, setAlias] = useState(baseDevice.alias);
  const [accent, setAccent] = useState(loadAccent);
  const [view, setView] = useState("inicio");
  const [now, setNow] = useState(() => Date.now());

  const auth = useAuth();
  const battery = useBattery();
  const device = useMemo(() => ({ ...baseDevice, alias }), [baseDevice, alias]);
  const history = useBatteryHistory({ user: auth.user, device });

  const { addSample } = history;

  useLayoutEffect(() => {
    applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!battery.supported || battery.level == null) return undefined;
    const record = () =>
      addSample({
        t: Date.now(),
        level: battery.level,
        charging: Boolean(battery.charging),
        deviceId: device.id,
      });
    record();
    const timer = setInterval(record, 60_000);
    return () => clearInterval(timer);
  }, [addSample, battery.supported, battery.level, battery.charging, device.id]);

  useEffect(() => {
    const labels = { inicio: "Inicio", historial: "Historial", ajustes: "Ajustes" };
    document.title = `BatteryLink · ${labels[view] ?? "Mi batería"}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const handleSaveAlias = (next) => {
    saveAlias(next);
    setAlias(next);
  };

  const meta = PAGE_META[view];
  const headerBadges = (
    <>
      <DeviceChip device={device} />
      {auth.user ? (
        <Badge tone="blue" icon={Cloud}>
          Historial en tu cuenta
        </Badge>
      ) : (
        <Badge tone="neutral" icon={CloudOff}>
          Solo este navegador
        </Badge>
      )}
    </>
  );

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onNavigate={setView}
        user={auth.user}
        syncState={history.syncState}
        onSignIn={auth.signIn}
        busy={auth.busy}
      />

      <div className="app-main">
        <MobileBrand user={auth.user} onSignIn={auth.signIn} />

        <main className="content">
          <PageHeader
            eyebrow={meta.eyebrow}
            title={meta.title(auth.user)}
            subtitle={meta.subtitle}
            badges={headerBadges}
            actions={
              view === "historial" ? (
                <ActionButton
                  variant="ghost"
                  icon={RefreshCw}
                  onClick={history.syncNow}
                  disabled={!auth.user}
                >
                  Sincronizar
                </ActionButton>
              ) : null
            }
          />

          {auth.error ? (
            <InfoBanner icon={TriangleAlert} title="No se pudo completar el inicio de sesión" tone="danger">
              {auth.error}{" "}
              <button className="link-inline" onClick={auth.clearError}>
                Descartar
              </button>
            </InfoBanner>
          ) : null}

          {view === "inicio" ? (
            <Dashboard
              battery={battery}
              device={device}
              user={auth.user}
              samples={history.samples}
              devices={history.devices}
              syncState={history.syncState}
              syncNow={history.syncNow}
              onSignIn={auth.signIn}
              onNavigate={setView}
              authBusy={auth.busy}
              now={now}
            />
          ) : null}

          {view === "historial" ? (
            <HistoryView
              samples={history.samples}
              devices={history.devices}
              device={device}
              user={auth.user}
              syncState={history.syncState}
              syncError={history.syncError}
              lastSync={history.lastSync}
              onSignIn={auth.signIn}
              onSync={history.syncNow}
              authBusy={auth.busy}
              now={now}
            />
          ) : null}

          {view === "ajustes" ? (
            <SettingsView
              user={auth.user}
              device={device}
              accent={accent}
              onAccentChange={setAccent}
              onSaveAlias={handleSaveAlias}
              samples={history.samples}
              syncState={history.syncState}
              lastSync={history.lastSync}
              onSignIn={auth.signIn}
              onSignOut={auth.signOut}
              onSync={history.syncNow}
              onClearHistory={history.clearHistory}
              authBusy={auth.busy}
              now={now}
            />
          ) : null}

          <p className="legal-foot">
            <span>BatteryLink · datos reales del navegador, sin simulaciones.</span>
            <span>
              Google y Firestore del proyecto de tesis <code>miapp-4a216</code> ·{" "}
              <a href="https://github.com/Ameri50/bateriapagina" target="_blank" rel="noreferrer">
                código en GitHub
              </a>
            </span>
          </p>
        </main>

        <MobileNav view={view} onNavigate={setView} />
      </div>
    </div>
  );
}
