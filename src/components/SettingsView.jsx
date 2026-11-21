import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  Cloud,
  CloudOff,
  CloudUpload,
  Code2,
  Download,
  Laptop,
  Link2,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Navigation,
  Palette,
  PencilLine,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  UserRound,
  Volume2,
} from "lucide-react";
import { ActionButton, Avatar, Badge, GlassCard, InfoBanner, KeyValue, SectionTitle, Toggle } from "./ui";
import { GoogleMark } from "./Layout";
import { ACCENTS } from "../lib/theme";
import { notificationPermission } from "../lib/alarm";
import { mapUrl } from "../lib/device";
import { compactNumber, firstName, relativeTime } from "../lib/format";

function syncLabel(syncState) {
  if (syncState === "synced") return "Sincronizado con tu cuenta";
  if (syncState === "syncing") return "Guardando en tu cuenta…";
  if (syncState === "error") return "Sin conexión con Firestore";
  return "Solo en este navegador";
}

function downloadHistory(samples, device, user) {
  const payload = {
    app: "BatteryLink Web",
    exportedAt: new Date().toISOString(),
    device: {
      id: device.id,
      alias: device.alias,
      model: device.model,
      platform: device.platform,
      browser: device.browser,
    },
    account: user ? { uid: user.uid, email: user.email } : null,
    samples,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `batterylink-historial-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsView({
  user,
  device,
  accent,
  onAccentChange,
  onSaveAlias,
  samples,
  syncState,
  lastSync,
  onSignIn,
  onSignOut,
  onSync,
  onClearHistory,
  authBusy,
  now,
  theme,
  onThemeChange,
  alarm,
  onAlarmChange,
  onEnableNotifications,
  onTestAlarm,
  location,
  locationStatus,
  locationError,
  onRequestLocation,
  onClearLocation,
}) {
  const [aliasDraft, setAliasDraft] = useState(device.alias);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [permissionNote, setPermissionNote] = useState("");
  const permission = notificationPermission();

  useEffect(() => {
    setAliasDraft(device.alias);
  }, [device.alias]);

  const trimmedAlias = aliasDraft.trim();
  const aliasDirty = trimmedAlias.length > 0 && trimmedAlias !== device.alias;
  const otherDevices = useMemo(
    () => samples.filter((sample) => sample.deviceId !== device.id).length,
    [samples, device.id],
  );

  const handleAliasSubmit = (event) => {
    event.preventDefault();
    if (trimmedAlias.length === 0 || trimmedAlias === device.alias) return;
    onSaveAlias(trimmedAlias);
  };

  const handleEnableNotifications = async () => {
    const result = await onEnableNotifications();
    if (result === "granted") setPermissionNote("Notificaciones activadas en este navegador.");
    else if (result === "denied") setPermissionNote("El navegador bloqueó las notificaciones. Habilítalas en los ajustes del sitio.");
    else if (result === "unsupported") setPermissionNote("Este navegador no admite notificaciones web (iOS necesita la app instalada).");
    else setPermissionNote("No se pudo pedir el permiso en este momento.");
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClearHistory();
      setConfirmingClear(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="settings-grid">
        <GlassCard className="settings-card">
          <SectionTitle
            icon={UserRound}
            title="Tu cuenta de Google"
            subtitle="El mismo proyecto de tesis de la app: miapp-4a216."
          />
          {user ? (
            <>
              <div className="account-full">
                <Avatar user={user} size={52} />
                <div className="account-full__text">
                  <strong>{user.displayName || firstName(user) || "Cuenta de Google"}</strong>
                  <span>{user.email}</span>
                  <div className="account-full__badges">
                    <Badge tone="good" icon={Check}>
                      Sesión activa
                    </Badge>
                    <Badge tone={syncState === "error" ? "danger" : "blue"} icon={syncState === "error" ? CloudOff : Cloud}>
                      {syncLabel(syncState)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="spec-list spec-list--compact">
                <KeyValue label="UID" value={`${user.uid.slice(0, 10)}…`} hint="Identificador de Firestore" />
                <KeyValue label="Proveedor" value="Google" hint="Inicio de sesión con Google" />
              </div>
              <div className="settings-actions">
                <ActionButton variant="ghost" icon={LogOut} onClick={onSignOut} disabled={authBusy}>
                  Cerrar sesión
                </ActionButton>
              </div>
            </>
          ) : (
            <>
              <p className="muted-text">
                Sin sesión, el historial se queda en este navegador. Al entrar con Google se guarda en tu propio documento
                del proyecto de tesis y aparece en tus otros equipos.
              </p>
              <div className="settings-actions">
                <ActionButton icon={LogIn} onClick={onSignIn} disabled={authBusy}>
                  {authBusy ? "Conectando…" : "Entrar con Google"}
                </ActionButton>
              </div>
              <p className="settings-note">
                <GoogleMark /> Se abre la ventana segura de Google. Esta página no ve tu contraseña.
              </p>
            </>
          )}
        </GlassCard>

        <GlassCard className="settings-card">
          <SectionTitle
            icon={Laptop}
            title="Este dispositivo"
            subtitle="El nombre que verás en el inicio, el historial y tus otras baterías."
          />
          <form className="alias-form" onSubmit={handleAliasSubmit}>
            <label className="field">
              <span>Nombre del equipo</span>
              <input
                value={aliasDraft}
                maxLength={40}
                placeholder="Mi Mac"
                onChange={(event) => setAliasDraft(event.target.value)}
              />
            </label>
            <ActionButton icon={Check} type="submit" disabled={!aliasDirty}>
              Guardar
            </ActionButton>
          </form>
          <div className="spec-list spec-list--compact">
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
          <p className="settings-note">
            <PencilLine size={13} /> Guardado en este navegador ({device.platform}) y en tu cuenta al sincronizar.
          </p>
        </GlassCard>

        <GlassCard className="settings-card">
          <SectionTitle
            icon={Palette}
            title="Color de la página"
            subtitle="El acento se aplica al anillo, las gráficas y los botones."
          />
          <div className="swatches" role="radiogroup" aria-label="Color de acento">
            {ACCENTS.map((option) => {
              const active = option.id === accent;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={option.label}
                  title={option.label}
                  className={`swatch ${active ? "swatch--active" : ""}`}
                  style={{ "--swatch-a": option.colors[0], "--swatch-b": option.colors[1] }}
                  onClick={() => onAccentChange(option.id)}
                >
                  {active ? <Check size={18} strokeWidth={3} /> : null}
                </button>
              );
            })}
          </div>
          <p className="settings-note">
            <Palette size={13} /> Preferencia local de este navegador; no se comparte con tu cuenta.
          </p>
        </GlassCard>

        <GlassCard className="settings-card">
          <SectionTitle
            icon={Sun}
            title="Apariencia"
            subtitle="Modo claro para el día o modo oscuro para poca luz."
          />
          <div className="theme-options" role="radiogroup" aria-label="Tema de la página">
            <button
              type="button"
              role="radio"
              aria-checked={theme === "light"}
              className={`theme-option ${theme === "light" ? "theme-option--active" : ""}`}
              onClick={() => onThemeChange("light")}
            >
              <Sun size={18} strokeWidth={2.1} />
              <span>Claro</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "dark"}
              className={`theme-option ${theme === "dark" ? "theme-option--active" : ""}`}
              onClick={() => onThemeChange("dark")}
            >
              <Moon size={18} strokeWidth={2.1} />
              <span>Oscuro</span>
            </button>
          </div>
          <p className="settings-note">
            <Sun size={13} /> Se guarda en este navegador; no se comparte con tu cuenta.
          </p>
        </GlassCard>

        <GlassCard className="settings-card">
          <SectionTitle
            icon={BellRing}
            title="Alarma al 100 %"
            subtitle="Aviso visible y sonido cuando una batería completa la carga."
          />
          <div className="toggle-row">
            <div>
              <strong>Activar alarma</strong>
              <span>Muestra un aviso en la página al llegar al 100 %.</span>
            </div>
            <Toggle
              checked={alarm.enabled}
              onChange={(value) => onAlarmChange({ enabled: value })}
              label="Activar alarma"
            />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Sonido</strong>
              <span>Un tono corto al completar la carga.</span>
            </div>
            <Toggle
              checked={alarm.sound}
              onChange={(value) => onAlarmChange({ sound: value })}
              label="Sonido de la alarma"
              disabled={!alarm.enabled}
            />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Notificaciones del sistema</strong>
              <span>
                {permission === "granted"
                  ? "El navegador ya permite avisos de BatteryLink."
                  : permission === "denied"
                    ? "Bloqueadas en este navegador; puedes habilitarlas en los ajustes del sitio."
                    : "Pide permiso para que el aviso aparezca fuera de la pestaña."}
              </span>
            </div>
            {permission === "granted" ? (
              <Badge tone="good" icon={Bell}>
                Permitidas
              </Badge>
            ) : (
              <ActionButton
                variant="ghost"
                icon={Bell}
                onClick={handleEnableNotifications}
                disabled={!alarm.enabled}
              >
                Permitir
              </ActionButton>
            )}
          </div>
          {permissionNote ? <p className="settings-note">{permissionNote}</p> : null}
          <div className="settings-actions">
            <ActionButton variant="ghost" icon={Volume2} onClick={onTestAlarm}>
              Probar alarma
            </ActionButton>
          </div>
          <p className="settings-note">
            <BellRing size={13} /> Solo funciona mientras la página está abierta. El iPhone no expone su batería a la web.
          </p>
        </GlassCard>

        <GlassCard className="settings-card">
          <SectionTitle
            icon={MapPin}
            title="Ubicación de este equipo"
            subtitle="Opcional: compártela para ver dónde está cada equipo de tu cuenta."
          />
          {location ? (
            <>
              <div className="location-preview">
                <span className="location-preview__pin">
                  <MapPin size={18} strokeWidth={2.1} />
                </span>
                <div>
                  <strong>
                    {location.lat}, {location.lng}
                  </strong>
                  <span>
                    {[
                      location.accuracy ? `Precisión ≈ ${Math.round(location.accuracy)} m` : "",
                      location.updatedAt ? relativeTime(location.updatedAt, now) : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
              <a className="link-button" href={mapUrl(location)} target="_blank" rel="noreferrer">
                <MapPin size={13} /> Ver en el mapa (OpenStreetMap)
              </a>
            </>
          ) : (
            <p className="muted-text">
              Todavía no compartes la ubicación de este equipo. El navegador pedirá permiso solo cuando pulses el botón.
            </p>
          )}
          {locationError ? (
            <InfoBanner icon={TriangleAlert} title="No se pudo obtener la ubicación" tone="warn">
              {locationError}
            </InfoBanner>
          ) : null}
          <div className="settings-actions">
            <ActionButton icon={Navigation} onClick={onRequestLocation} disabled={locationStatus === "locating"}>
              {locationStatus === "locating"
                ? "Obteniendo…"
                : location
                  ? "Actualizar ubicación"
                  : "Compartir ubicación"}
            </ActionButton>
            {location ? (
              <ActionButton variant="ghost" icon={Trash2} onClick={onClearLocation}>
                Quitar
              </ActionButton>
            ) : null}
          </div>
          <p className="settings-note">
            <ShieldCheck size={13} /> Es una ubicación aproximada del navegador. Se guarda solo cuando la compartes y no se
            actualiza en segundo plano.
          </p>
        </GlassCard>

        <GlassCard className="settings-card">
          <SectionTitle
            icon={ShieldCheck}
            title="Privacidad y datos"
            subtitle="Qué se guarda, dónde y qué no puede leer la web."
          />
          <ul className="privacy-list">
            <li>
              Solo se guardan lecturas reales de batería (nivel, estado de carga y hora) junto al nombre y modelo del
              equipo.
            </li>
            <li>
              Con sesión, viven en tu documento <code>users/{user ? `${user.uid.slice(0, 6)}…` : "{uid}"}</code> de
              Firestore, en el campo <code>battery</code>. Las reglas del proyecto solo permiten leerlo y escribirlo a tu
              propia cuenta.
            </li>
            <li>Sin sesión, todo se queda en <code>localStorage</code> de este navegador. Nada se envía a terceros.</li>
            <li>
              La web no puede leer salud, ciclos ni temperatura: esos datos solo los entrega la app nativa BatteryLink.
            </li>
          </ul>
          <div className="settings-links">
            <a href="https://github.com/Ameri50/bateriapagina" target="_blank" rel="noreferrer">
              <Code2 size={14} /> Código de esta página
            </a>
            <a href="https://github.com/Ameri50/aplicacion-de-bateria" target="_blank" rel="noreferrer">
              <Link2 size={14} /> App BatteryLink para Mac e iPhone
            </a>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="settings-card settings-card--wide">
        <SectionTitle
          icon={CloudUpload}
          title="Historial guardado"
          subtitle="Tus muestras, la sincronización y las copias de seguridad."
        />
        <div className="data-strip">
          <div className="data-strip__item">
            <span>Muestras locales</span>
            <strong>{compactNumber(samples.length)}</strong>
            <small>máximo 720</small>
          </div>
          <div className="data-strip__item">
            <span>Última sincronización</span>
            <strong>{lastSync ? relativeTime(lastSync, now) : "—"}</strong>
            <small>{syncLabel(syncState)}</small>
          </div>
          <div className="data-strip__item">
            <span>Otros equipos</span>
            <strong>{compactNumber(otherDevices)}</strong>
            <small>muestras en tu cuenta</small>
          </div>
        </div>

        <div className="settings-actions">
          <ActionButton variant="ghost" icon={CloudUpload} onClick={onSync} disabled={!user || samples.length === 0}>
            Sincronizar ahora
          </ActionButton>
          <ActionButton
            variant="ghost"
            icon={Download}
            onClick={() => downloadHistory(samples, device, user)}
            disabled={samples.length === 0}
          >
            Exportar JSON
          </ActionButton>
          {confirmingClear ? (
            <span className="inline-confirm">
              <TriangleAlert size={14} /> Se borrará de este navegador{user ? " y de tu cuenta" : ""}.
              <button className="button button--danger" onClick={handleClear} disabled={clearing}>
                {clearing ? "Borrando…" : "Sí, borrar"}
              </button>
              <button className="button button--ghost" onClick={() => setConfirmingClear(false)} disabled={clearing}>
                Cancelar
              </button>
            </span>
          ) : (
            <ActionButton
              variant="danger"
              icon={Trash2}
              onClick={() => setConfirmingClear(true)}
              disabled={samples.length === 0}
            >
              Borrar historial
            </ActionButton>
          )}
        </div>
      </GlassCard>
    </>
  );
}
