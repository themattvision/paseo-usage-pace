import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { View } from "react-native";
import type { PaceTone } from "../shared/pace";

// Barra di consumo con lineetta del ritmo, condivisa da riga della sidebar e schermata.
// Sotto ritmo: riempimento verde fino al consumo. Sopra ritmo: verde fino alla lineetta
// (la parte "in regola") e, dalla lineetta al consumo, un colore diverso (arancione fino a
// 10 punti di eccesso, rosso oltre) che mostra a colpo d'occhio quanto si è sforato.
type Theme = PluginScreenProps["theme"];

const MARKER_WIDTH = 3;
const MARKER_OVERSHOOT = 4;

interface PaceBarProps {
  usedPct: number;
  elapsedPct: number | null;
  tone: PaceTone | null;
  theme: Theme;
  height?: number;
}

function PaceBar({ usedPct, elapsedPct, tone, theme, height = 8 }: PaceBarProps) {
  const used = Math.min(100, Math.max(0, usedPct));
  const over = elapsedPct !== null && used > elapsedPct;
  const baseEnd = over ? (elapsedPct as number) : used;
  const excessColor = tone === "danger" ? theme.colors.statusDanger : theme.colors.statusWarning;
  const radius = height / 2;

  return (
    <View style={{ flex: 1, height }}>
      <View
        style={{
          ...absoluteFill,
          borderRadius: radius,
          overflow: "hidden",
          backgroundColor: theme.colors.border,
        }}
      >
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
      {elapsedPct !== null ? (
        <View
          style={{
            position: "absolute",
            top: -MARKER_OVERSHOOT,
            height: height + MARKER_OVERSHOOT * 2,
            width: MARKER_WIDTH,
            left: `${elapsedPct}%`,
            marginLeft: -MARKER_WIDTH / 2,
            borderRadius: MARKER_WIDTH / 2,
            backgroundColor: theme.colors.foreground,
          }}
        />
      ) : null}
    </View>
  );
}

const absoluteFill = { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 } as const;

export { PaceBar };
