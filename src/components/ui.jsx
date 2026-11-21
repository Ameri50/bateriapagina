import { Zap } from "lucide-react";

export function GlassCard({ children, className = "", padded = true }) {
  return <section className={`glass ${padded ? "glass--padded" : ""} ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral", icon: Icon }) {
  return (
    <span className={`badge badge--${tone}`}>
      {Icon ? <Icon size={14} strokeWidth={2.2} /> : <span className="badge__dot" />}
      {children}
    </span>
  );
}

export function SectionTitle({ icon: Icon, title, subtitle, tint }) {
  return (
    <header className="section-title">
      {Icon ? (
        <span className="icon-bubble" style={tint ? { "--bubble": tint } : undefined}>
          <Icon size={17} strokeWidth={2.1} />
        </span>
      ) : null}
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </header>
  );
}

export function KeyValue({ label, value, hint, tone }) {
  return (
    <div className="kv">
      <span className="kv__label">{label}</span>
      <span className={`kv__value ${tone ? `kv__value--${tone}` : ""}`}>{value}</span>
      {hint ? <span className="kv__hint">{hint}</span> : null}
    </div>
  );
}

export function InfoBanner({ icon: Icon, title, children, tone = "info" }) {
  return (
    <div className={`banner banner--${tone}`}>
      {Icon ? (
        <span className="banner__icon">
          <Icon size={18} strokeWidth={2.1} />
        </span>
      ) : null}
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function ActionButton({ children, icon: Icon, variant = "primary", onClick, disabled, type = "button" }) {
  return (
    <button className={`button button--${variant}`} onClick={onClick} disabled={disabled} type={type}>
      {Icon ? <Icon size={16} strokeWidth={2.2} /> : null}
      {children}
    </button>
  );
}

export function Avatar({ user, size = 40 }) {
  const name = user?.displayName?.trim();
  const fallback = name
    ? name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
    : "B";
  if (user?.photoURL) {
    return <img className="avatar" style={{ width: size, height: size }} src={user.photoURL} alt={name ?? "Cuenta"} referrerPolicy="no-referrer" />;
  }
  return (
    <span className="avatar avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {fallback}
    </span>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "toggle--on" : ""}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="toggle__knob" />
    </button>
  );
}

export function MiniBattery({ level, charging, size = 34 }) {
  const tone = level == null ? "muted" : level <= 15 ? "danger" : level <= 35 ? "warn" : "good";
  return (
    <span className={`mini-battery mini-battery--${tone}`} style={{ "--mini-size": `${size}px` }}>
      <span className="mini-battery__fill" style={{ width: `${level == null ? 0 : Math.max(4, Math.min(100, level))}%` }} />
      {charging ? <Zap className="mini-battery__bolt" size={11} strokeWidth={2.6} /> : null}
    </span>
  );
}
