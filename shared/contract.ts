import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

// Finestra di consumo di un provider (Session, Weekly, 5-hour, ...).
export const UsageWindowSchema = z.object({
  id: z.string(),
  label: z.string(),
  usedPct: z.number().nullable(),
  remainingPct: z.number().nullable(),
  resetsAt: z.string().nullable(),
  durationSec: z.number().positive().nullable(),
});
export type UsageWindow = z.infer<typeof UsageWindowSchema>;

export const ProviderUsageSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconSvg: z.string().nullable(),
  plan: z.string().nullable(),
  error: z.string().nullable(),
  windows: z.array(UsageWindowSchema),
});
export type ProviderUsage = z.infer<typeof ProviderUsageSchema>;

export const RitmoErrorSchema = z.object({
  code: z.enum(["not_installed", "timeout", "command_failed", "bad_output"]),
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

export const ConfigErrorSchema = z.object({
  code: z.enum(["invalid_file", "write_failed"]),
  message: z.string(),
});

export const RitmoConfigResultSchema = z.object({
  config: RitmoConfigSchema,
  error: ConfigErrorSchema.nullable(),
});
export type RitmoConfigResult = z.infer<typeof RitmoConfigResultSchema>;

export const ritmoUsageRpc = defineRpc({
  name: "ritmo.usage",
  input: z.object({}),
  output: RitmoUsageSchema,
});

export const ritmoConfigGetRpc = defineRpc({
  name: "ritmo.config.get",
  input: z.object({}),
  output: RitmoConfigResultSchema,
});

export const ritmoConfigSetRpc = defineRpc({
  name: "ritmo.config.set",
  input: RitmoConfigSchema,
  output: RitmoConfigResultSchema,
});
