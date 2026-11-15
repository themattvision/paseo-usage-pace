import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { Icon, ScrollView } from "@getpaseo/plugin/client/ui";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { ProviderUsage, UsageWindow } from "../shared/contract";
import { formatRemaining, paceFor, type PaceTone } from "../shared/pace";
import { PaceBar } from "./PaceBar";
import { pickFooterWindow, useNow, useRitmoConfig, useRitmoUsage, windowTag } from "./useRitmo";

// Schermata completa: una scheda per ogni provider configurato (logo, nome, piano) con tutte
// le sue finestre di consumo. Il segnaposto a destra di ogni finestra sceglie quale mostrare
// nella barra in fondo alla sidebar.
// Scala delle misure: 4/8/12/16/24. Schede con margine 16, stacco fra schede 24,
// stacco fra finestre 24, gap interno di una finestra 8.
type Props = Pick<PluginScreenProps, "theme" | "layout">;
type Theme = PluginScreenProps["theme"];

const TAP_TARGET = 44;

function toneColor(tone: PaceTone | null, theme: Theme): string {
  if (tone === "ok") return theme.colors.statusSuccess;
  if (tone === "warning") return theme.colors.statusWarning;
  if (tone === "danger") return theme.colors.statusDanger;
  return theme.colors.foregroundMuted;
}

function formatClock(resetsAt: string): string {
  return new Date(resetsAt).toLocaleString("it-IT", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PinButton({
  pinned,
  label,
  onPress,
  theme,
}: {
  pinned: boolean;
  label: string;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: pinned }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: TAP_TARGET,
        height: TAP_TARGET,
        marginVertical: -12,
        marginRight: -12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        name="Pin"
        size={20}
        color={pinned ? theme.colors.foreground : theme.colors.foregroundMuted}
      />
    </Pressable>
  );
}

function WindowBlock({
  win,
  now,
  theme,
  pinned,
  onPin,
}: {
  win: UsageWindow;
  now: number;
  theme: Theme;
  pinned: boolean;
  onPin: () => void;
}) {
  const used = win.usedPct === null ? null : Math.max(0, win.usedPct);
  const pace = used === null ? null : paceFor(used, win.durationSec ?? 0, win.resetsAt, now);
  const resetLine = win.resetsAt
    ? `Reset tra ${formatRemaining(win.resetsAt, now)} · ${formatClock(win.resetsAt)}`
    : "Reset non disponibile";

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: theme.colors.foreground,
            fontSize: 16,
            lineHeight: 24,
            fontWeight: "600",
          }}
        >
          {win.label}
        </Text>
        <Text
          style={{
            color: theme.colors.foreground,
            fontSize: 16,
            lineHeight: 24,
            fontVariant: ["tabular-nums"],
          }}
        >
          {used === null ? "n/d" : `${Math.round(Math.max(0, 100 - used))}% rimasto`}
        </Text>
        <PinButton
          pinned={pinned}
          theme={theme}
          onPress={onPin}
          label={
            pinned
              ? `${win.label} è mostrata nella barra in fondo`
              : `Mostra ${win.label} nella barra in fondo`
          }
        />
      </View>
      <View style={{ flexDirection: "row" }}>
        <PaceBar
          usedPct={used ?? 0}
          elapsedPct={pace?.elapsedPct ?? null}
          tone={pace?.tone ?? null}
          theme={theme}
        />
      </View>
      <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
        {resetLine}
      </Text>
      {pace?.text ? (
        <Text
          style={{
            color: toneColor(pace.tone, theme),
            fontSize: 14,
            lineHeight: 20,
            fontWeight: "600",
          }}
        >
          {pace.text}
        </Text>
      ) : null}
    </View>
  );
}

function ProviderCard({
  provider,
  now,
  theme,
  pinnedWindowId,
  onPin,
}: {
  provider: ProviderUsage;
  now: number;
  theme: Theme;
  pinnedWindowId: string | null;
  onPin: (windowId: string) => void;
}) {
  return (
    <View style={{ backgroundColor: theme.colors.surface1, borderRadius: 16, padding: 16, gap: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {provider.iconSvg ? (
          <Icon icon={{ svg: provider.iconSvg }} size={24} color={theme.colors.foreground} />
        ) : (
          <Icon name="Gauge" size={24} color={theme.colors.foreground} />
        )}
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            color: theme.colors.foreground,
            fontSize: 20,
            lineHeight: 24,
            fontWeight: "600",
          }}
        >
          {provider.name}
        </Text>
        {provider.plan ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: theme.colors.surface2,
            }}
          >
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 16 }}>
              {provider.plan}
            </Text>
          </View>
        ) : null}
      </View>
      {provider.error ? (
        <Text style={{ color: theme.colors.statusWarning, fontSize: 13, lineHeight: 20 }}>
          {provider.error}
        </Text>
      ) : null}
      {provider.windows.length === 0 ? (
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 14, lineHeight: 20 }}>
          Nessun limite di consumo disponibile per questo account.
        </Text>
      ) : (
        provider.windows.map((win) => (
          <WindowBlock
            key={win.id}
            win={win}
            now={now}
            theme={theme}
            pinned={pinnedWindowId === win.id}
            onPin={() => onPin(win.id)}
          />
        ))
      )}
    </View>
  );
}

function Notice({ title, text, theme, action }: { title: string; text: string; theme: Theme; action?: ReactNode }) {
  return (
    <View style={{ backgroundColor: theme.colors.surface1, borderRadius: 16, padding: 16, gap: 16 }}>
      <Text style={{ color: theme.colors.foreground, fontSize: 16, lineHeight: 24, fontWeight: "600" }}>
        {title}
      </Text>
      <Text style={{ color: theme.colors.foregroundMuted, fontSize: 14, lineHeight: 20 }}>{text}</Text>
      {action}
    </View>
  );
}

export function RitmoView({ theme, layout }: Props) {
  const usage = useRitmoUsage();
  const { config, save, saveError } = useRitmoConfig();
  const now = useNow();

  const pad = layout.compact ? 16 : 24;
  const data = usage.data ?? null;
  const providers = data?.providers ?? [];
  const choice = pickFooterWindow(providers, config);

  const minutesAgo = usage.dataUpdatedAt
    ? Math.max(0, Math.floor((now - usage.dataUpdatedAt) / 60_000))
    : null;
  const updatedText =
    minutesAgo === null
      ? "Aggiornamento in corso"
      : minutesAgo === 0
        ? "Aggiornato poco fa"
        : `Aggiornato ${minutesAgo} min fa`;

  const retryButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Riprova a leggere il consumo"
      onPress={() => {
        void usage.refetch();
      }}
      style={{
        alignSelf: "flex-start",
        minHeight: 40,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surface2,
      }}
    >
      <Text style={{ color: theme.colors.foreground, fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
        Riprova
      </Text>
    </Pressable>
  );

  let body: ReactNode;
  if (providers.length > 0) {
    body = (
      <>
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            now={now}
            theme={theme}
            pinnedWindowId={choice?.provider.id === provider.id ? choice.window.id : null}
            onPin={(windowId) => save({ footer: { providerId: provider.id, windowId } })}
          />
        ))}
        {data?.stale ? (
          <Text style={{ color: theme.colors.statusWarning, fontSize: 13, lineHeight: 20 }}>
            {data.error?.message ?? "Questi dati non sono aggiornati: mostro l'ultima lettura riuscita."}
          </Text>
        ) : null}
        {saveError ? (
          <Text style={{ color: theme.colors.statusDanger, fontSize: 13, lineHeight: 20 }}>
            {saveError.message}
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                backgroundColor: theme.colors.foreground,
              }}
            />
            <Text style={{ flex: 1, color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
              La barra parte piena e si svuota man mano che consumi. La lineetta è dove dovresti
              essere se consumassi in modo uniforme. Verde chiaro oltre la lineetta è il vantaggio
              che hai; arancione o rosso fra la tua barra e la lineetta è il consumo in eccesso.
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="Pin" size={16} color={theme.colors.foregroundMuted} />
            <Text style={{ flex: 1, color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
              Tocca il segnaposto di una finestra per mostrarla nella barra in fondo alla sidebar
              {choice ? ` (ora: ${choice.provider.name} ${windowTag(choice.window)}).` : "."}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
            {updatedText}
          </Text>
          {retryButton}
        </View>
      </>
    );
  } else if (usage.isPending) {
    body = (
      <Notice title="Leggo i limiti di consumo" text="Ci metto pochi secondi." theme={theme} />
    );
  } else {
    body = (
      <Notice
        title="Non riesco a leggere il consumo"
        text={
          data?.error?.message ??
          "Non ho trovato nessun provider con i limiti di consumo. Controlla che Paseo sia aperto, poi premi Riprova."
        }
        theme={theme}
        action={retryButton}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.surface0 }}
      contentContainerStyle={{ padding: pad, gap: 24 }}
    >
      {body}
    </ScrollView>
  );
}
