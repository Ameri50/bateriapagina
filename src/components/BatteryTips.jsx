import {
  BatteryMedium,
  Lightbulb,
  PlugZap,
  ShieldCheck,
  Snowflake,
  Sun,
  Unplug,
} from "lucide-react";
import { GlassCard, SectionTitle } from "./ui";

const TIPS = [
  {
    icon: BatteryMedium,
    title: "Vive entre el 20 % y el 80 %",
    text: "Las celdas de litio sufren menos cuando no están ni casi vacías ni siempre al máximo. Cargar por tramos es mejor que esperar al 0 %.",
  },
  {
    icon: Unplug,
    title: "Desenchufa al llegar al 100 %",
    text: "Mantener la carga completa durante horas acelera el desgaste. Si puedes, activa el aviso de batería llena y desconecta al terminar.",
  },
  {
    icon: Sun,
    title: "Evita el calor más que la carga",
    text: "El sol directo, la cama, el coche o una funda que no ventila elevan la temperatura y dañan la batería. Trabaja sobre superficies duras.",
  },
  {
    icon: PlugZap,
    title: "Usa cargador certificado",
    text: "Un cargador original o de una marca conocida entrega la energía de forma estable. Los muy baratos pueden calentar de más.",
  },
  {
    icon: Snowflake,
    title: "Guarda el equipo al 50 %",
    text: "Si vas a dejarlo apagado semanas, déjalo a media carga en un lugar fresco. Ni al 100 % ni descargado del todo.",
  },
  {
    icon: ShieldCheck,
    title: "La salud real no se mide aquí",
    text: "La web solo lee el nivel y el estado de carga. La salud, los ciclos y la temperatura los consulta la app nativa BatteryLink.",
  },
];

export function BatteryTips({ highlightFull = false }) {
  return (
    <GlassCard>
      <SectionTitle
        icon={Lightbulb}
        title="Recomendaciones para cuidar tu batería"
        subtitle="Hábitos sencillos que reducen el desgaste químico y alargan su vida útil."
      />
      <ul className="tip-list">
        {TIPS.map((tip) => {
          const Icon = tip.icon;
          const active = highlightFull && tip.icon === Unplug;
          return (
            <li key={tip.title} className={`tip ${active ? "tip--active" : ""}`}>
              <span className="tip__icon">
                <Icon size={16} strokeWidth={2.1} />
              </span>
              <div>
                <strong>{tip.title}</strong>
                <p>{tip.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
