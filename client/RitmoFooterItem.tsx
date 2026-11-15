import type { PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { formatRemaining, paceFor } from "../shared/pace";
import { PaceBar } from "./PaceBar";
import { pickFooterWindow, useNow, useRitmoConfig, useRitmoUsage, windowTag } from "./useRitmo";

// Riga compatta in fondo alla sidebar: logo del provider scelto, barra del RIMANENTE della
// finestra scelta con la lineetta del ritmo, percentuale rimasta e, accanto, quanto manca al
// rinnovo (es. "1h 18m"). Il tocco sulla scritta a destra alterna il tempo che manca e l'orario
// del rinnovo ("alle 00:00"); il tocco su icona e barra apre la schermata completa.
// La finestra si sceglie nella schermata completa.
// Misure dalla scala 4/8/12/16: margini 16, gap 12, barra 8, tocco alto almeno 44.
// Non usa SidebarRow: il suo slot "trailing" non si allarga, quindi la barra restava corta
// e il testo usciva dal bordo destro (screenshot di Matteo del 15 novembre 2026).
const ICON_SIZE = 20; // stessa misura delle icone delle altre righe della sidebar
const TAP_TARGET = 44;

/** Orario del rinnovo: "00:00" se è oggi, altrimenti con il giorno ("sab 00:00"). */
function formatResetClock(resetsAt: string, nowMs: number): string {
  const reset = new Date(resetsAt);
  const time = reset.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const sameDay = reset.toDateString() === new Date(nowMs).toDateString();
  if (sameDay) return time;
  const day = reset.toLocaleDateString("it-IT", { weekday: "short" });
  return `${day} ${time}`;
}

function RitmoFooterItem({ theme, openScreen }: PluginSidebarItemProps) {
  const usage = useRitmoUsage();
  const { config } = useRitmoConfig();
  const now = useNow(30_000);
  const [showClock, setShowClock] = useState(false);

  const choice = pickFooterWindow(usage.data?.providers ?? [], config);
  const win = choice?.window ?? null;
  const used = win?.usedPct ?? null;
  const pace =
    win && used !== null
      ? paceFor(Math.max(0, used), win.durationSec ?? 0, win.resetsAt, now)
      : null;
  // Si mostra quanto RIMANE (la barra si svuota), non quanto è stato consumato.
  const remainingLabel = used === null ? "n/d" : `${Math.round(Math.max(0, 100 - used))}%`;
  const providerName = choice?.provider.name ?? "Consumo";

  let detail = "";
  if (win && used !== null) {
    if (!win.resetsAt) detail = windowTag(win);
    else if (showClock) detail = `alle ${formatResetClock(win.resetsAt, now)}`;
    else detail = formatRemaining(win.resetsAt, now);
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ritmo consumo, ${providerName}, ${remainingLabel} rimasto. Apri i dettagli`}
        onPress={() => openScreen({ screenId: "ritmo" })}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          minHeight: TAP_TARGET,
          gap: 12,
        }}
      >
        {choice?.provider.iconSvg ? (
          <Icon
            icon={{ svg: choice.provider.iconSvg }}
            size={ICON_SIZE}
            color={theme.colors.foregroundMuted}
          />
        ) : (
          <Icon name="Gauge" size={ICON_SIZE} color={theme.colors.foregroundMuted} />
        )}
        <PaceBar
          usedPct={used ?? 0}
          elapsedPct={pace?.elapsedPct ?? null}
          tone={pace?.tone ?? null}
          theme={theme}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          showClock
            ? "Mostra quanto manca al rinnovo"
            : "Mostra l'orario del rinnovo"
        }
        onPress={() => setShowClock((value) => !value)}
        style={{ minHeight: TAP_TARGET, justifyContent: "center" }}
      >
        <Text
          numberOfLines={1}
          style={{
            textAlign: "right",
            fontSize: 16,
            lineHeight: 24,
            fontVariant: ["tabular-nums"],
            color: theme.colors.foreground,
          }}
        >
          {remainingLabel}
          {detail ? (
            <Text style={{ color: theme.colors.foregroundMuted }}>{` ${detail}`}</Text>
          ) : null}
        </Text>
      </Pressable>
    </View>
  );
}

export { RitmoFooterItem };
