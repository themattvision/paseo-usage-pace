import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { View } from "react-native";
import type { PaceTone } from "../shared/pace";

// Barra di consumo con lineetta del ritmo, condivisa da riga della sidebar e schermata.
// Una sola barra (8), tre strati sulla traccia:
// 1. dietro, il tratto fra il consumo e la lineetta quando si è SOTTO ritmo: arancione
//    attenuato, è il margine che resta (scelta di Matteo, 15 novembre 2026);
// 2. il riempimento del consumo, verde;
// 3. sopra ritmo, dalla lineetta al consumo, il colore dell'eccesso (arancione fino a
//    10 punti, rosso oltre).
// La lineetta nera attraversa la barra.
type Theme = PluginScreenProps["theme"];

const MARKER_WIDTH = 3;
const MARKER_OVERSHOOT = 4;
// Arancione vivo e saturo per il margine (richiesta di Matteo, 15 novembre 2026: "più vivo").
const MARGIN_COLOR = "#ff8a1f";

interface PaceBarProps {
  usedPct: number;
  elapsedPct: number | null;
  tone: PaceTone | null;
  theme: Theme;
  height?: number;
}

function PaceBar({ usedPct, elapsedPct, tone, theme, height = 8 }: PaceBarProps) {
  const used = Math.min(100, Math.max(0, usedPct));
  const hasPace = elapsedPct !== null;
  const pace = hasPace ? (elapsedPct as number) : 0;
  const over = hasPace && used > pace;
  const baseEnd = over ? pace : used;
  const excessColor = tone === "danger" ? theme.colors.statusDanger : theme.colors.statusWarning;

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
        {hasPace && !over && pace > used ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${used}%`,
              width: `${pace - used}%`,
              backgroundColor: MARGIN_COLOR,
            }}
          />
        ) : null}
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${baseEnd}%`,
            backgroundColor: theme.colors.statusSuccess,
          }}
        />
        {over ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${baseEnd}%`,
              width: `${used - baseEnd}%`,
              backgroundColor: excessColor,
            }}
          />
        ) : null}
      </View>
      {hasPace ? (
        <View
          style={{
            position: "absolute",
            top: -MARKER_OVERSHOOT,
            height: height + MARKER_OVERSHOOT * 2,
            width: MARKER_WIDTH,
            left: `${pace}%`,
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
