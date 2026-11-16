import { useRpc } from "@getpaseo/plugin/client";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ritmoConfigGetRpc,
  ritmoConfigSetRpc,
  ritmoUsageRpc,
  type ConfigErrorCode,
  type ProviderUsage,
  type RitmoConfig,
  type UsageWindow,
} from "../shared/contract";

// Hook condivisi dalla riga in fondo alla sidebar e dalla schermata completa: stessa
// chiave di cache, quindi una sola lettura ogni minuto per tutti e due.
const REFRESH_MS = 60_000;
const USAGE_KEY = ["usage-pace", "usage"] as const;
const CONFIG_KEY = ["usage-pace", "config"] as const;

export function useRitmoUsage() {
  const fetchUsage = useRpc(ritmoUsageRpc);
  return useQuery({
    queryKey: USAGE_KEY,
    queryFn: () => fetchUsage({}),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS / 2,
  });
}

const REFRESH_MUTATION_KEY = ["usage-pace", "refresh"] as const;

/**
 * Lettura manuale: chiede a Paseo di rileggere (force), poi mette il risultato nella stessa
 * cache di useRitmoUsage, cosi' riga in fondo e schermata si aggiornano insieme.
 * La chiave della mutation e' condivisa: `refreshing` e il blocco del doppio tocco valgono
 * anche tra un'istanza e l'altra dell'hook (riga in sidebar e schermata).
 * Errori: restano i dati attuali, nessun messaggio grezzo.
 */
export function useRitmoRefresh() {
  const fetchUsage = useRpc(ritmoUsageRpc);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: REFRESH_MUTATION_KEY,
    mutationFn: () => fetchUsage({ force: true }),
    onSuccess: (data) => {
      queryClient.setQueryData(USAGE_KEY, data);
    },
  });
  const refreshing = useIsMutating({ mutationKey: REFRESH_MUTATION_KEY }) > 0;
  const refresh = () => {
    if (queryClient.isMutating({ mutationKey: REFRESH_MUTATION_KEY }) > 0) return;
    mutation.mutate();
  };
  return { refresh, refreshing };
}

/** Errore di salvataggio: codice del server, oppure "save_failed" se la chiamata stessa e' fallita. */
export type SaveError = ConfigErrorCode | "save_failed";

export function useRitmoConfig() {
  const getConfig = useRpc(ritmoConfigGetRpc);
  const setConfig = useRpc(ritmoConfigSetRpc);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CONFIG_KEY,
    queryFn: () => getConfig({}),
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: (next: RitmoConfig) => setConfig(next),
    onSuccess: (result) => {
      queryClient.setQueryData(CONFIG_KEY, result);
    },
  });
  const saveError: SaveError | null =
    mutation.data?.error?.code ?? (mutation.isError ? "save_failed" : null);
  return {
    config: query.data?.config ?? { footer: null },
    save: (next: RitmoConfig) => mutation.mutate(next),
    saving: mutation.isPending,
    saveError,
  };
}

/** Un'ora corrente che si aggiorna da sola, per ricalcolare il ritmo senza nuove letture. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export interface FooterChoice {
  provider: ProviderUsage;
  window: UsageWindow;
}

/** La finestra scelta dall'utente, altrimenti la piu' corta del primo provider che ne ha una. */
export function pickFooterWindow(
  providers: readonly ProviderUsage[],
  config: RitmoConfig,
): FooterChoice | null {
  if (config.footer) {
    const provider = providers.find((p) => p.id === config.footer?.providerId);
    const window = provider?.windows.find((w) => w.id === config.footer?.windowId);
    if (provider && window) return { provider, window };
  }
  // Ordine fisso per nome (Claude, Codex...), cosi' la scelta di default non cambia da sola.
  const ordered = [...providers].sort((a, b) => a.name.localeCompare(b.name));
  for (const provider of ordered) {
    if (provider.windows.length === 0) continue;
    const sorted = [...provider.windows].sort(
      (a, b) => (a.durationSec ?? Number.MAX_SAFE_INTEGER) - (b.durationSec ?? Number.MAX_SAFE_INTEGER),
    );
    return { provider, window: sorted[0] as UsageWindow };
  }
  return null;
}

/** Etichetta breve della durata: "5h", "7d". Senza durata, la prima parola dell'etichetta. */
export function windowTag(win: UsageWindow): string {
  const sec = win.durationSec;
  if (sec !== null) {
    if (sec % 86400 === 0) return `${sec / 86400}d`;
    if (sec % 3600 === 0) return `${sec / 3600}h`;
  }
  return win.label.split(" ")[0] ?? win.label;
}
