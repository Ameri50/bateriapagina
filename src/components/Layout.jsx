import { BatteryCharging, Cloud, CloudOff, History, Home, LogIn, Settings, Smartphone } from "lucide-react";
import { Avatar } from "./ui";
import { firstName } from "../lib/format";

export const NAV_ITEMS = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "historial", label: "Historial", icon: History },
  { id: "ajustes", label: "Ajustes", icon: Settings },
];

function SyncPill({ syncState }) {
  if (syncState === "synced") {
    return (
      <span className="sync-pill sync-pill--on">
        <Cloud size={13} strokeWidth={2.2} /> Cuenta sincronizada
      </span>
    );
  }
  if (syncState === "syncing") {
    return (
      <span className="sync-pill">
        <span className="sync-dot" /> Guardando en tu cuenta…
      </span>
    );
  }
  if (syncState === "error") {
    return (
      <span className="sync-pill sync-pill--error">
        <CloudOff size={13} strokeWidth={2.2} /> Sin conexión con Firestore
      </span>
    );
  }
  return (
    <span className="sync-pill">
      <CloudOff size={13} strokeWidth={2.2} /> Solo en este navegador
    </span>
  );
}

export function Sidebar({ view, onNavigate, user, syncState, onSignIn, busy }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__icon">
          <BatteryCharging size={22} strokeWidth={2.2} />
        </span>
        <div>
          <strong>BatteryLink</strong>
          <span>Mi batería</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "nav-item--active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={17} strokeWidth={2.2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <SyncPill syncState={syncState} />
        {user ? (
          <div className="account-mini">
            <Avatar user={user} size={36} />
            <div>
              <strong>{firstName(user)}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        ) : (
          <button className="google-button google-button--compact" onClick={onSignIn} disabled={busy}>
            <GoogleMark />
            Entrar con Google
          </button>
        )}
      </div>
    </aside>
  );
}

export function MobileNav({ view, onNavigate }) {
  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`mobile-nav__item ${view === item.id ? "mobile-nav__item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={19} strokeWidth={2.1} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function MobileBrand({ user, onSignIn }) {
  return (
    <div className="mobile-brand">
      <div className="brand brand--small">
        <span className="brand__icon">
          <BatteryCharging size={18} strokeWidth={2.2} />
        </span>
        <div>
          <strong>BatteryLink</strong>
          <span>Mi batería</span>
        </div>
      </div>
      {user ? (
        <Avatar user={user} size={34} />
      ) : (
        <button className="icon-button" onClick={onSignIn} aria-label="Entrar con Google">
          <LogIn size={17} strokeWidth={2.1} />
        </button>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, badges, actions }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {badges ? <div className="page-header__badges">{badges}</div> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function DeviceChip({ device }) {
  return (
    <span className="device-chip">
      <Smartphone size={13} strokeWidth={2.2} />
      {device.alias}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.8 6.1C12.2 13.4 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6z" />
      <path fill="#FBBC05" d="M10.3 28.6a14.5 14.5 0 0 1 0-9.2l-7.8-6.1a24 24 0 0 0 0 21.4l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.8-3.9-13.7-9.4l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export { GoogleMark };
