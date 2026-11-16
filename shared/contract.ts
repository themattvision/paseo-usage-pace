import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

// Finestra di consumo di un provider (Session, Weekly, 5-hour, ...). Il label arriva dalla fonte dati.
export const UsageWindowSchema = z.object({
  id: z.string(),
  label: z.string(),
  usedPct: z.number().nullable(),
  remainingPct: z.number().nullable(),
  resetsAt: z.string().nullable(),
  durationSec: z.number().positive().nullable(),
});
export type UsageWindow = z.infer<typeof UsageWindowSchema>;

// Codice stabile del problema di lettura di un provider. Il testo lo scrive il client,
// nella lingua dell'app: il server non produce testo per l'utente.
export const ProviderProblemSchema = z.enum([
  "rate_limited",
  "expired",
  "rejected",
  "no_quota",
  "unavailable",
  "read_failed",
]);
export type ProviderProblem = z.infer<typeof ProviderProblemSchema>;

export const ProviderUsageSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconSvg: z.string().nullable(),
  plan: z.string().nullable(),
  problem: ProviderProblemSchema.nullable(),
  // Vero quando le finestre mostrate vengono dall'ultima lettura riuscita.
  showingLastReading: z.boolean(),
  windows: z.array(UsageWindowSchema),
});
export type ProviderUsage = z.infer<typeof ProviderUsageSchema>;

export const RitmoErrorSchema = z.object({
  code: z.enum(["not_installed", "timeout", "command_failed", "bad_output"]),
  // Testo inglese di ripiego per i log tecnici. La UI usa solo il code.
  message: z.string(),
});
export type RitmoError = z.infer<typeof RitmoErrorSchema>;

export const RitmoUsageSchema = z.object({
  providers: z.array(ProviderUsageSchema),
  fetchedAt: z.string(),
  stale: z.boolean(),
  error: RitmoErrorSchema.nullable(),
});
export type RitmoUsage = z.infer<typeof RitmoUsageSchema>;

// Configurazione: quale finestra mostrare nel footer. Null vuol dire default della UI.
export const RitmoConfigSchema = z.object({
  footer: z
    .object({
      providerId: z.string().min(1),
      windowId: z.string().min(1),
    })
    .nullable(),
});
export type RitmoConfig = z.infer<typeof RitmoConfigSchema>;

export const ConfigErrorCodeSchema = z.enum(["invalid_file", "invalid_input", "write_failed"]);
export type ConfigErrorCode = z.infer<typeof ConfigErrorCodeSchema>;

export const ConfigErrorSchema = z.object({
  code: ConfigErrorCodeSchema,
  // Testo inglese di ripiego per i log tecnici. La UI usa solo il code.
  message: z.string(),
});

export const RitmoConfigResultSchema = z.object({
  config: RitmoConfigSchema,
  error: ConfigErrorSchema.nullable(),
});
export type RitmoConfigResult = z.infer<typeof RitmoConfigResultSchema>;

export const ritmoUsageRpc = defineRpc({
  name: "pace.usage",
  // force: lettura manuale, salta la cache di 30 secondi del plugin e chiede a Paseo di rileggere.
  input: z.object({ force: z.boolean().optional() }),
  output: RitmoUsageSchema,
});

export const ritmoConfigGetRpc = defineRpc({
  name: "pace.config.get",
  input: z.object({}),
  output: RitmoConfigResultSchema,
});

export const ritmoConfigSetRpc = defineRpc({
  name: "pace.config.set",
  input: RitmoConfigSchema,
  output: RitmoConfigResultSchema,
});
