import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useTranslation } from "@getpaseo/plugin/client";
import { Icon, ScrollView } from "@getpaseo/plugin/client/ui";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type {
  ProviderProblem,
  ProviderUsage,
  RitmoError,
  UsageWindow,
} from "../shared/contract";
import { formatRemaining, paceFor, type PaceTone } from "../shared/pace";
import { messages } from "./i18n";
import { PaceBar } from "./PaceBar";
import {
  pickFooterWindow,
  useNow,
  useRitmoConfig,
  useRitmoRefresh,
  useRitmoUsage,
  windowTag,
  type SaveError,
} from "./useRitmo";

// Schermata completa: una scheda per ogni provider configurato (logo, nome, piano) con tutte
// le sue finestre di consumo. Il segnaposto a destra di ogni finestra sceglie quale mostrare
// nella barra in fondo alla sidebar.
// Scala delle misure: 4/8/12/16/24. Schede con margine 16, stacco fra schede 24,
// stacco fra finestre 24, gap interno di una finestra 8.
// Tutto il testo viene dalle traduzioni (client/i18n.ts). Il server manda solo codici.
type Props = Pick<PluginScreenProps, "theme" | "layout">;
type Theme = PluginScreenProps["theme"];

const TAP_TARGET = 44;

const ERROR_KEY = {
  not_installed: "error.not_installed",
  timeout: "error.timeout",
  command_failed: "error.command_failed",
  bad_output: "error.bad_output",
} as const satisfies Record<RitmoError["code"], string>;

const PROBLEM_KEY = {
  rate_limited: "problem.rate_limited",
  expired: "problem.expired",
  rejected: "problem.rejected",
  no_quota: "problem.no_quota",
  unavailable: "problem.unavailable",
  read_failed: "problem.read_failed",
} as const satisfies Record<ProviderProblem, string>;

const SAVE_ERROR_KEY = {
  invalid_file: "config.invalid_file",
  invalid_input: "config.invalid_input",
  write_failed: "config.write_failed",
  save_failed: "common.saveFailed",
} as const satisfies Record<SaveError, string>;

function toneColor(tone: PaceTone | null, theme: Theme): string {
  if (tone === "ok") return theme.colors.statusSuccess;
  if (tone === "warning") return theme.colors.statusWarning;
  if (tone === "danger") return theme.colors.statusDanger;
  return theme.colors.foregroundMuted;
}

/** Orario del rinnovo con giorno abbreviato, nella lingua dell'app. */
function formatClock(resetsAt: string, locale: string): string {
  return new Date(resetsAt).toLocaleString(locale, {
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
  const { t, locale } = useTranslation(messages);
  const used = win.usedPct === null ? null : Math.max(0, win.usedPct);
  const pace = used === null ? null : paceFor(used, win.durationSec ?? 0, win.resetsAt, now);
  const resetLine = win.resetsAt
    ? t("card.resetIn", {
        remaining: formatRemaining(win.resetsAt, now),
        clock: formatClock(win.resetsAt, locale),
      })
    : t("card.resetUnknown");
  const paceText =
    pace && pace.diffPct !== null && pace.elapsedPct !== null
      ? pace.diffPct <= 0
        ? t("card.aheadOfPace", {
            percent: Math.round(-pace.diffPct),
            elapsed: Math.round(pace.elapsedPct),
          })
        : t("card.behindPace", {
            percent: Math.round(pace.diffPct),
            elapsed: Math.round(pace.elapsedPct),
          })
      : null;

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
          {used === null
            ? t("common.noData")
            : t("common.remaining", { percent: Math.round(Math.max(0, 100 - used)) })}
        </Text>
        <PinButton
          pinned={pinned}
          theme={theme}
          onPress={onPin}
          label={
            pinned
              ? t("card.pinShown", { label: win.label })
              : t("card.pinShow", { label: win.label })
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
      {paceText ? (
        <Text
          style={{
            color: toneColor(pace?.tone ?? null, theme),
            fontSize: 14,
            lineHeight: 20,
            fontWeight: "600",
          }}
        >
          {paceText}
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
  onRefresh,
  refreshing,
}: {
  provider: ProviderUsage;
  now: number;
  theme: Theme;
  pinnedWindowId: string | null;
  onPin: (windowId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t } = useTranslation(messages);
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
        {/* Area di tocco 44x44; il margine negativo la riporta dentro il padding 16 della scheda. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("actions.refresh")}
          accessibilityState={{ disabled: refreshing }}
          disabled={refreshing}
          onPress={onRefresh}
          style={{
            marginLeft: "auto",
            marginRight: -12,
            marginVertical: -12,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            opacity: refreshing ? 0.4 : 1,
          }}
        >
          <Icon name="RefreshCw" size={20} color={theme.colors.foregroundMuted} />
        </Pressable>
      </View>
      {provider.problem ? (
        <Text style={{ color: theme.colors.statusWarning, fontSize: 13, lineHeight: 20 }}>
          {provider.showingLastReading
            ? `${t(PROBLEM_KEY[provider.problem])} ${t("problem.lastReading")}`
            : t(PROBLEM_KEY[provider.problem])}
        </Text>
      ) : null}
      {provider.windows.length === 0 ? (
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 14, lineHeight: 20 }}>
          {t("card.noWindows")}
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
  const { t } = useTranslation(messages);
  const usage = useRitmoUsage();
  const { refresh, refreshing } = useRitmoRefresh();
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
      ? t("common.updating")
      : minutesAgo === 0
        ? t("common.updatedJustNow")
        : t("common.updatedMinutesAgo", { minutes: minutesAgo });

  const retryButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("common.retryLabel")}
      onPress={refresh}
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
        {t("common.retry")}
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
            onRefresh={refresh}
            refreshing={refreshing}
          />
        ))}
        {data?.stale && data.error ? (
          <Text style={{ color: theme.colors.statusWarning, fontSize: 13, lineHeight: 20 }}>
            {t(ERROR_KEY[data.error.code])}
          </Text>
        ) : null}
        {saveError ? (
          <Text style={{ color: theme.colors.statusDanger, fontSize: 13, lineHeight: 20 }}>
            {t(SAVE_ERROR_KEY[saveError])}
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {/* Icone in una colonna di 16 allineata alla prima riga del testo (lineHeight 20). */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View style={{ width: 16, height: 20, alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  width: 3,
                  height: 16,
                  borderRadius: 2,
                  backgroundColor: theme.colors.foreground,
                }}
              />
            </View>
            <Text style={{ flex: 1, color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
              {t("explain.bar")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View style={{ width: 16, height: 20, alignItems: "center", justifyContent: "center" }}>
              <Icon name="Pin" size={16} color={theme.colors.foregroundMuted} />
            </View>
            <Text style={{ flex: 1, color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
              {choice
                ? t("explain.pinNow", {
                    provider: choice.provider.name,
                    window: windowTag(choice.window),
                  })
                : t("explain.pin")}
            </Text>
          </View>
        </View>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13, lineHeight: 20 }}>
          {updatedText}
        </Text>
      </>
    );
  } else if (usage.isPending) {
    body = (
      <Notice title={t("state.loadingTitle")} text={t("state.loadingText")} theme={theme} />
    );
  } else {
    body = (
      <Notice
        title={t("state.errorTitle")}
        text={data?.error ? t(ERROR_KEY[data.error.code]) : t("state.errorText")}
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
