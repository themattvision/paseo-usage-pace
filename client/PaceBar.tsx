import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { View } from "react-native";
import type { PaceTone } from "../shared/pace";

// Barra di consumo con lineetta del ritmo, condivisa da riga della sidebar e schermata.
// Barra principale (8): verde fino al consumo; se si è sopra ritmo, verde fino alla lineetta
// e dal punto della lineetta al consumo il colore dell'eccesso (arancione fino a 10 punti,
// rosso oltre). Barretta sotto (4): copre sempre la DISTANZA fra consumo e lineetta.
// Sotto ritmo è un verde chiaro (margine che resta), sopra ritmo ha il colore dell'eccesso.
type Theme = PluginScreenProps["theme"];

const MARKER_WIDTH = 3;
const MARKER_OVERSHOOT = 4;
const GAP_SPACING = 4;
const GAP_HEIGHT = 4;
const MARGIN_OPACITY = 0.4;

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
  const over = hasPace && used > (elapsedPct as number);
  const baseEnd = over ? (elapsedPct as number) : used;
  const excessColor = tone === "danger" ? theme.colors.statusDanger : theme.colors.statusWarning;
  const radius = height / 2;
  const gapStart = hasPace ? Math.min(used, elapsedPct as number) : 0;
  const gapEnd = hasPace ? Math.max(used, elapsedPct as number) : 0;
  const totalHeight = hasPace ? height + GAP_SPACING + GAP_HEIGHT : height;

  return (
    <View style={{ flex: 1, height: totalHeight }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height,
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
      {hasPace && gapEnd > gapStart ? (
        <View
          style={{
            position: "absolute",
            top: height + GAP_SPACING,
            height: GAP_HEIGHT,
            left: `${gapStart}%`,
            width: `${gapEnd - gapStart}%`,
            borderRadius: GAP_HEIGHT / 2,
            backgroundColor: over ? excessColor : theme.colors.statusSuccess,
            opacity: over ? 1 : MARGIN_OPACITY,
          }}
        />
      ) : null}
      {hasPace ? (
        <View
          style={{
            position: "absolute",
            top: -MARKER_OVERSHOOT,
            height: totalHeight + MARKER_OVERSHOOT * 2,
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

export { PaceBar };
