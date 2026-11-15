// Calcolo del ritmo di consumo. Funzioni pure: nessuna rete, nessun DOM, nessun React Native.

export type PaceTone = "ok" | "warning" | "danger";

export interface PaceResult {
  /** Dove dovresti essere se consumassi in modo uniforme nella finestra, da 0 a 100. Null senza resetsAt. */
  elapsedPct: number | null;
  /** Percentuale usata meno elapsedPct. */
  diffPct: number | null;
  tone: PaceTone | null;
  text: string | null;
}

const NONE: PaceResult = { elapsedPct: null, diffPct: null, tone: null, text: null };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function paceFor(
  usedPct: number,
  durationSec: number,
  resetsAt: string | null,
  nowMs: number,
): PaceResult {
  if (!resetsAt || durationSec <= 0) return NONE;
  const resetMs = Date.parse(resetsAt);
  if (Number.isNaN(resetMs)) return NONE;
  const remainingSec = (resetMs - nowMs) / 1000;
  const elapsedPct = clamp(((durationSec - remainingSec) / durationSec) * 100, 0, 100);
  const diffPct = usedPct - elapsedPct;
  const elapsedRounded = Math.round(elapsedPct);
  if (diffPct <= 0) {
    return {
      elapsedPct,
      diffPct,
      tone: "ok",
      text: `${Math.round(-diffPct)}% di vantaggio sul ritmo (tempo trascorso ${elapsedRounded}%)`,
    };
  }
  const tone: PaceTone = diffPct > 10 ? "danger" : "warning";
  return {
    elapsedPct,
    diffPct,
    tone,
    text: `${Math.round(diffPct)}% di troppo rispetto al ritmo (tempo trascorso ${elapsedRounded}%)`,
  };
}

/** Tempo mancante al reset in forma breve, per esempio "5d 13h", "1h 50m" o "12m". */
export function formatRemaining(resetsAt: string, nowMs: number): string {
  const resetMs = Date.parse(resetsAt);
  if (Number.isNaN(resetMs)) return "";
  const totalMin = Math.max(0, Math.floor((resetMs - nowMs) / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
