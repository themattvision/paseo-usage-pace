// Dati di consumo di tutti i provider configurati su questo Mac.
// Fonte: il comando `paseo usage ls --json`, cioe' la stessa lettura che usa Paseo per il suo
// pannello Usage. Il plugin non tocca credenziali, Portachiavi o endpoint dei provider.
// Scelta: il plugin non ha un metodo tipizzato nell'SDK per leggere i report di consumo
// (il metodo listUsage del client e' presente nel runtime ma non e' documentato), quindi
// si usa il CLI con execFile, senza shell, con timeout e output limitato.
// Il server non produce testo per l'utente: restituisce codici (RitmoError.code, ProviderUsage.problem).
// I message sono solo inglese tecnico di ripiego per i log.
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type {
  ProviderProblem,
  ProviderUsage,
  RitmoError,
  RitmoUsage,
  UsageWindow,
} from "../shared/contract";

const CACHE_TTL_MS = 30_000;
const COMMAND_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const EXTRA_PATH = [
  join(homedir(), ".local", "bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
];
// Il primo percorso che esiste vince; "paseo" da PATH e' l'ultimo fallback.
const PASEO_CANDIDATES = [
  join(homedir(), ".local", "bin", "paseo"),
  "/opt/homebrew/bin/paseo",
  "/usr/local/bin/paseo",
  "paseo",
];

const WindowSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortLabel: z.string().nullish(),
  usedPct: z.number().nullish(),
  remainingPct: z.number().nullish(),
  resetsAt: z.string().nullish(),
  durationSec: z.number().positive().nullish(),
});

const ReportSchema = z.object({
  status: z.string(),
  planLabel: z.string().nullish(),
  error: z.string().nullish(),
  problem: z.object({ kind: z.string() }).passthrough().nullish(),
  windows: z.array(WindowSchema).nullish(),
});

const EntrySchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  sourceLabel: z.string().nullish(),
  icon: z.string().nullish(),
  report: ReportSchema.nullish(),
  lastSuccessful: z.object({ report: ReportSchema }).nullish(),
});
const ListSchema = z.array(EntrySchema);

let cached: { expires: number; promise: Promise<RitmoUsage> } | null = null;
let lastGood: RitmoUsage | null = null;

// Richieste simultanee condividono la stessa lettura per 30 secondi.
export function fetchRitmoUsage(): Promise<RitmoUsage> {
  const now = Date.now();
  if (cached && cached.expires > now) return cached.promise;
  const promise = loadUsage();
  cached = { expires: now + CACHE_TTL_MS, promise };
  return promise;
}

type RunResult = { ok: true; stdout: string } | { ok: false; error: RitmoError };

function runPaseoUsage(candidates: string[] = PASEO_CANDIDATES): Promise<RunResult> {
  const [bin, ...rest] = candidates;
  return new Promise((resolve) => {
    execFile(
      bin,
      ["usage", "ls", "--json"],
      {
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
        env: { ...process.env, PATH: [process.env.PATH ?? "", ...EXTRA_PATH].join(":") },
      },
      (error, stdout) => {
        if (!error) {
          resolve({ ok: true, stdout });
          return;
        }
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT" && rest.length > 0) {
          resolve(runPaseoUsage(rest));
          return;
        }
        if (code === "ENOENT") {
          resolve({
            ok: false,
            error: { code: "not_installed", message: "Paseo is not installed on this Mac." },
          });
          return;
        }
        if (error.killed || error.signal === "SIGTERM") {
          resolve({
            ok: false,
            error: { code: "timeout", message: "Paseo did not respond in time." },
          });
          return;
        }
        resolve({
          ok: false,
          error: { code: "command_failed", message: "Could not read usage from Paseo." },
        });
      },
    );
  });
}

// Durata della finestra: prima il dato della fonte, poi id/label, altrimenti null.
export function windowDurationSec(w: z.infer<typeof WindowSchema>): number | null {
  if (w.durationSec) return w.durationSec;
  const text = `${w.id} ${w.label} ${w.shortLabel ?? ""}`.toLowerCase();
  if (/five_hour|session/.test(text)) return 5 * 60 * 60;
  if (/weekly|\bweek\b|\bwk\b/.test(text)) return 7 * 24 * 60 * 60;
  const hours = text.match(/(\d+)\s*-?\s*h(?:ours?|rs?)?\b/);
  if (hours) return Number(hours[1]) * 60 * 60;
  const days = text.match(/(\d+)\s*-?\s*d(?:ays?)?\b/);
  if (days) return Number(days[1]) * 24 * 60 * 60;
  return null;
}

function toWindows(list: z.infer<typeof WindowSchema>[] | null | undefined): UsageWindow[] {
  return (list ?? []).map((w) => ({
    id: w.id,
    label: w.label,
    usedPct: w.usedPct ?? null,
    remainingPct: w.remainingPct ?? null,
    resetsAt: w.resetsAt ?? null,
    durationSec: windowDurationSec(w),
  }));
}

function problemOf(report: z.infer<typeof ReportSchema>): ProviderProblem {
  if (report.status === "unavailable") {
    const kind = report.problem?.kind;
    if (kind === "expired") return "expired";
    if (kind === "rejected") return "rejected";
    if (kind === "no_quota") return "no_quota";
    return "unavailable";
  }
  if (/rate.?limit/i.test(report.error ?? "")) return "rate_limited";
  return "read_failed";
}

function toProvider(entry: z.infer<typeof EntrySchema>): ProviderUsage {
  const current = entry.report;
  const previous = entry.lastSuccessful?.report;
  const icon = entry.icon && entry.icon.includes("<svg") ? entry.icon : null;
  const base = { id: entry.id, name: entry.sourceLabel?.trim() || entry.sourceId, iconSvg: icon };

  if (current?.status === "available") {
    return {
      ...base,
      plan: current.planLabel ?? null,
      problem: null,
      showingLastReading: false,
      windows: toWindows(current.windows),
    };
  }
  const problem: ProviderProblem = current ? problemOf(current) : "unavailable";
  if (previous?.status === "available") {
    return {
      ...base,
      plan: previous.planLabel ?? null,
      problem,
      showingLastReading: true,
      windows: toWindows(previous.windows),
    };
  }
  return { ...base, plan: null, problem, showingLastReading: false, windows: [] };
}

// TRAPPOLA: quando Paseo non riesce a leggere un provider (es. limite di richieste di Claude)
// restituisce `lastSuccessful`, che puo' essere piu' vecchio di una lettura gia' vista da noi.
// SINTOMO: la percentuale oscilla fra due valori (22% poi 20%). Nella stessa finestra di
// consumo il valore non puo' scendere, quindi teniamo in memoria il massimo gia' visto per
// ogni finestra (stesso reset, entro 2 minuti) e non mostriamo mai un numero piu' basso.
const SAME_RESET_TOLERANCE_MS = 2 * 60 * 1000;
const seen = new Map<string, { usedPct: number; resetsAt: string | null }>();

function sameReset(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  const diff = Math.abs(Date.parse(a) - Date.parse(b));
  return Number.isNaN(diff) ? a === b : diff <= SAME_RESET_TOLERANCE_MS;
}

function mergeMonotonic(providers: ProviderUsage[]): ProviderUsage[] {
  return providers.map((provider) => ({
    ...provider,
    windows: provider.windows.map((win) => {
      if (win.usedPct === null) return win;
      const key = `${provider.id}:${win.id}`;
      const memory = seen.get(key);
      if (memory && sameReset(memory.resetsAt, win.resetsAt) && memory.usedPct > win.usedPct) {
        return { ...win, usedPct: memory.usedPct, remainingPct: Math.max(0, 100 - memory.usedPct) };
      }
      seen.set(key, { usedPct: win.usedPct, resetsAt: win.resetsAt });
      return win;
    }),
  }));
}

async function loadUsage(): Promise<RitmoUsage> {
  const read = await runPaseoUsage();
  if (!read.ok) return fallback(read.error);

  let entries: z.infer<typeof ListSchema>;
  try {
    const parsed = ListSchema.safeParse(JSON.parse(read.stdout));
    if (!parsed.success) {
      return fallback({ code: "bad_output", message: "Paseo data is not in the expected format." });
    }
    entries = parsed.data;
  } catch {
    return fallback({ code: "bad_output", message: "Paseo data is not in the expected format." });
  }

  const result: RitmoUsage = {
    providers: mergeMonotonic(entries.map(toProvider)),
    fetchedAt: new Date().toISOString(),
    stale: false,
    error: null,
  };
  lastGood = result;
  return result;
}

// Se la lettura fallisce restituisce l'ultimo risultato buono, marcato come vecchio.
function fallback(error: RitmoError): RitmoUsage {
  if (lastGood) return { ...lastGood, stale: true, error };
  return { providers: [], fetchedAt: new Date().toISOString(), stale: false, error };
}
