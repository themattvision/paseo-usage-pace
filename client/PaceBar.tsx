import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { View } from "react-native";
import type { PaceTone } from "../shared/pace";

// Barra del consumo RIMANENTE (come una batteria): parte piena a sinistra e si svuota verso
// lo zero man mano che consumi (richiesta dell'utente, 15 novembre 2026).
// La lineetta nera sta dove dovresti avere ancora a quel punto della finestra se consumassi
// in modo uniforme: 100 meno il tempo trascorso.
// Strati sulla traccia, tutti ancorati a sinistra:
// - verde pieno: tutto il rimanente reale, senza sfumature (un verde spento a meta barra
//   si leggeva come "roba che non c'e' piu'", screenshot dell'utente delle 22:42);
// - vantaggio: la barra supera la lineetta, non serve nessun colore in piu';
// - svantaggio (hai MENO rimanente della lineetta): il tratto mancante fra il tuo rimanente
//   e la lineetta ha il colore dell'eccesso (arancione fino a 10 punti, rosso oltre).
type Theme = PluginScreenProps["theme"];

const MARKER_WIDTH = 3;
const MARKER_OVERSHOOT = 4;

interface PaceBarProps {
  /** Percentuale consumata, da 0 a 100. */
  usedPct: number;
  /** Tempo trascorso della finestra, da 0 a 100. Null se non si conosce il reset. */
  elapsedPct: number | null;
  tone: PaceTone | null;
  theme: Theme;
  height?: number;
}

function PaceBar({ usedPct, elapsedPct, tone, theme, height = 8 }: PaceBarProps) {
  const remaining = 100 - Math.min(100, Math.max(0, usedPct));
  const hasPace = elapsedPct !== null;
  const paceRemaining = hasPace ? 100 - (elapsedPct as number) : 0;
  const deficit = hasPace && remaining < paceRemaining;
  const solidEnd = remaining;
  const deficitColor = tone === "danger" ? theme.colors.statusDanger : theme.colors.statusWarning;

  return (
    <View style={{ flex: 1, height }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height,
          borderRadius: height / 2,
          overflow: "hidden",
          backgroundColor: theme.colors.border,
        }}
      >
        {deficit ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${remaining}%`,
              width: `${paceRemaining - remaining}%`,
              backgroundColor: deficitColor,
            }}
          />
        ) : null}
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${solidEnd}%`,
            backgroundColor: theme.colors.statusSuccess,
          }}
        />
      </View>
      {hasPace ? (
        <View
          style={{
            position: "absolute",
            top: -MARKER_OVERSHOOT,
            height: height + MARKER_OVERSHOOT * 2,
            width: MARKER_WIDTH,
            left: `${paceRemaining}%`,
            marginLeft: -MARKER_WIDTH / 2,
            borderRadius: MARKER_WIDTH / 2,
            backgroundColor: theme.colors.foreground,
          }}
        />
      ) : null}
    </View>
  );
}

export { PaceBar };
