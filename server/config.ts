// Configurazione del footer, salvata come JSON in una cartella dati del plugin sotto ~/.paseo.
// Il Paseo SDK non offre un metodo di scrittura lato server per le settings (solo lettura
// e ascolto), quindi il file e' gestito dal plugin: scrittura atomica, validazione zod.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  RitmoConfigSchema,
  type RitmoConfig,
  type RitmoConfigResult,
} from "../shared/contract";

const CONFIG_PATH = join(homedir(), ".paseo", "plugin-data", "ritmo-consumo", "config.json");
const DEFAULT_CONFIG: RitmoConfig = { footer: null };

export async function getRitmoConfig(): Promise<RitmoConfigResult> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = RitmoConfigSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { config: parsed.data, error: null };
    return invalid();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { config: DEFAULT_CONFIG, error: null };
    }
    return invalid();
  }
}

export async function setRitmoConfig(input: RitmoConfig): Promise<RitmoConfigResult> {
  const parsed = RitmoConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { config: DEFAULT_CONFIG, error: { code: "invalid_file", message: "La configurazione non è valida." } };
  }
  const tmp = `${CONFIG_PATH}.${randomUUID()}.tmp`;
  try {
    await mkdir(dirname(CONFIG_PATH), { recursive: true });
    await writeFile(tmp, `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");
    await rename(tmp, CONFIG_PATH);
    return { config: parsed.data, error: null };
  } catch {
    await unlink(tmp).catch(() => undefined);
    return {
      config: (await getRitmoConfig()).config,
      error: { code: "write_failed", message: "Non sono riuscito a salvare la configurazione." },
    };
  }
}

function invalid(): RitmoConfigResult {
  return {
    config: DEFAULT_CONFIG,
    error: {
      code: "invalid_file",
      message: "Il file di configurazione non è leggibile: uso i valori predefiniti.",
    },
  };
}
