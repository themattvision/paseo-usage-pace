import type { PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/ui";
import { Pressable, Text } from "react-native";
import { paceFor } from "../shared/pace";
import { PaceBar } from "./PaceBar";
import { pickFooterWindow, useNow, useRitmoConfig, useRitmoUsage, windowTag } from "./useRitmo";

// Riga compatta in fondo alla sidebar: logo del provider scelto, barra della finestra scelta
// con la lineetta del ritmo (e l'eccesso di un altro colore), percentuale usata.
// La finestra si sceglie nella schermata completa. Il tocco apre quella schermata.
// Misure dalla scala 4/8/12/16: margini 16, gap 12, barra 8, tocco alto almeno 44.
// Non usa SidebarRow: il suo slot "trailing" non si allarga, quindi la barra restava corta
// e il testo usciva dal bordo destro (screenshot di Matteo del 15 novembre 2026).
const ICON_SIZE = 20; // stessa misura delle icone delle altre righe della sidebar

function RitmoFooterItem({ theme, openScreen }: PluginSidebarItemProps) {
  const usage = useRitmoUsage();
  const { config } = useRitmoConfig();
  const now = useNow(60_000);

  const choice = pickFooterWindow(usage.data?.providers ?? [], config);
  const win = choice?.window ?? null;
  const used = win?.usedPct ?? null;
  const pace =
    win && used !== null
      ? paceFor(Math.max(0, used), win.durationSec ?? 0, win.resetsAt, now)
      : null;
  const usedLabel = used === null ? "n/d" : `${Math.round(used)}%`;
  const tag = win ? windowTag(win) : "";
  const providerName = choice?.provider.name ?? "Consumo";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ritmo consumo, ${providerName} ${tag} ${usedLabel}. Apri i dettagli`}
      onPress={() => openScreen({ screenId: "ritmo" })}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        minHeight: 44,
        paddingHorizontal: 16,
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
        {usedLabel}
        {tag && used !== null ? (
          <Text style={{ color: theme.colors.foregroundMuted }}>{` ${tag}`}</Text>
        ) : null}
      </Text>
    </Pressable>
  );
}

export { RitmoFooterItem };
