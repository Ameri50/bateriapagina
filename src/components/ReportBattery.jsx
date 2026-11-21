import { useEffect, useState } from "react";
import { BatteryCharging, Check, Smartphone } from "lucide-react";
import { ActionButton, GlassCard, SectionTitle, Toggle } from "./ui";
import { relativeTime } from "../lib/format";

export function ReportBattery({ device, lastSample, onReport, user, now, mobile = false }) {
  const [level, setLevel] = useState(() => (lastSample ? lastSample.level : 50));
  const [charging, setCharging] = useState(() => Boolean(lastSample?.charging));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const apple = device.platform === "iPhone" || device.platform === "iPad";

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [saved]);

  const handleSave = async () => {
    setBusy(true);
    setSaved(false);
    await onReport({ level, charging });
    setBusy(false);
    setSaved(true);
  };

  return (
    <GlassCard className={`report-card ${mobile ? "report-card--mobile" : ""}`}>
      <SectionTitle
        icon={apple ? Smartphone : BatteryCharging}
        title={apple ? `Batería de este ${device.platform}` : "Batería de este equipo"}
        subtitle={
          apple
            ? "iOS no permite leerla desde la web. Registra la que muestra Ajustes y aparecerá aquí."
            : "Este navegador no la expone. Regístrala a mano; en Chrome o Edge se lee sola."
        }
      />

      {lastSample ? (
        <p className="report-card__last">
          Última lectura: <strong>{lastSample.level} %</strong> ·{" "}
          {lastSample.charging ? "cargando" : "descargando"} · {relativeTime(lastSample.t, now)}
        </p>
      ) : null}

      <div className="report-card__level">
        <strong>
          {level}
          <span>%</span>
        </strong>
        <span className="report-card__state">{charging ? "Cargando" : "Con batería"}</span>
      </div>

      <input
        className="report-range"
        type="range"
        min="0"
        max="100"
        step="1"
        value={level}
        style={{ "--fill": `${level}%` }}
        aria-label="Nivel de batería"
        onChange={(event) => setLevel(Number(event.target.value))}
      />
      <div className="report-scale">
        <span>0 %</span>
        <span>50 %</span>
        <span>100 %</span>
      </div>

      <div className="toggle-row">
        <div>
          <strong>Está cargando</strong>
          <span>Actívalo si el teléfono está conectado al cargador.</span>
        </div>
        <Toggle checked={charging} onChange={setCharging} label="Está cargando" />
      </div>

      <div className="report-actions">
        <ActionButton icon={Check} onClick={handleSave} disabled={busy}>
          {busy ? "Guardando…" : "Guardar lectura"}
        </ActionButton>
        {saved ? <span className="report-saved">Lectura guardada{sampleSummary(level, charging)}</span> : null}
      </div>

      <p className="note-line">
        Se guarda como lectura manual, separada de las que mide el navegador.
        {user
          ? " Aparece en «Tus baterías» y en el historial de tu cuenta."
          : " Sin sesión se queda solo en este navegador."}
      </p>
    </GlassCard>
  );
}

function sampleSummary(level, charging) {
  return `: ${level} % ${charging ? "cargando" : "con batería"}`;
}
