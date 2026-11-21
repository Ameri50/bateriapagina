import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BellRing, Cloud, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useBattery } from "./hooks/useBattery";
import { useBatteryHistory } from "./hooks/useBatteryHistory";
import { useChargeAlarm } from "./hooks/useChargeAlarm";
import { useDeviceLocation } from "./hooks/useDeviceLocation";
import { useIsMobile } from "./hooks/useIsMobile";
import { loadDevice, saveAlias } from "./lib/device";
import { applyAccent, applyTheme, loadAccent, loadTheme } from "./lib/theme";
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
  const [theme, setTheme] = useState(loadTheme);
  const [view, setView] = useState("inicio");
  const [now, setNow] = useState(() => Date.now());
  const isMobile = useIsMobile();

  const auth = useAuth();
  const battery = useBattery();
  const deviceLocation = useDeviceLocation();
  const device = useMemo(
    () => ({ ...baseDevice, alias, location: deviceLocation.location }),
    [baseDevice, alias, deviceLocation.location],
  );
  const history = useBatteryHistory({ user: auth.user, device });
  const alarm = useChargeAlarm({ level: battery.level, charging: battery.charging, device });

  const { addSample } = history;
  const locationSyncRef = useRef(deviceLocation.location);

  useLayoutEffect(() => {
    applyAccent(accent);
  }, [accent]);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (locationSyncRef.current === deviceLocation.location) return;
    locationSyncRef.current = deviceLocation.location;
    history.syncNow();
  }, [deviceLocation.location, history.syncNow]);

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

  const handleReportBattery = async (payload) => {
    await history.reportManual(payload);
    alarm.check(payload.level, payload.charging);
  };

  const meta = PAGE_META[view];
  const mobileHome = view === "inicio" && isMobile;
  const title = mobileHome ? "Tus baterías" : meta.title(auth.user);
  const subtitle = mobileHome
    ? "Registra la de este teléfono y consulta las computadoras conectadas con tu cuenta."
    : meta.subtitle;

  const headerBadges = isMobile ? (
    auth.user ? (
      <Badge tone="blue" icon={Cloud}>
        En tu cuenta
      </Badge>
    ) : (
      <Badge tone="neutral" icon={CloudOff}>
        Sin cuenta
      </Badge>
    )
  ) : (
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
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />

      <div className="app-main">
        <MobileBrand
          user={auth.user}
          onSignIn={auth.signIn}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />

        <main className="content">
          <PageHeader
            eyebrow={meta.eyebrow}
            title={title}
            subtitle={subtitle}
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

          {alarm.alert ? (
            <InfoBanner icon={BellRing} title={`${alarm.alert.alias} llegó al 100 %`} tone="good">
              Desenchúfala para cuidar la batería.{" "}
              <button className="link-inline" onClick={alarm.dismiss}>
                Descartar
              </button>{" "}
              ·{" "}
              <button
                className="link-inline"
                onClick={() => {
                  alarm.dismiss();
                  setView("ajustes");
                }}
              >
                Configurar alarma
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
              onReportBattery={handleReportBattery}
              onSignIn={auth.signIn}
              onNavigate={setView}
              authBusy={auth.busy}
              now={now}
              mobile={isMobile}
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
              mobile={isMobile}
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
              theme={theme}
              onThemeChange={setTheme}
              alarm={alarm.settings}
              onAlarmChange={alarm.update}
              onEnableNotifications={alarm.enableNotifications}
              onTestAlarm={alarm.test}
              location={deviceLocation.location}
              locationStatus={deviceLocation.status}
              locationError={deviceLocation.error}
              onRequestLocation={deviceLocation.request}
              onClearLocation={deviceLocation.clear}
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
