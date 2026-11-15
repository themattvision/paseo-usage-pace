// Configurazione del footer, salvata come JSON in una cartella dati del plugin sotto ~/.paseo.
// Il Paseo SDK non offre un metodo di scrittura lato server per le settings (solo lettura
// e ascolto), quindi il file e' gestito dal plugin: scrittura atomica, validazione zod.
// Gli errori portano un code stabile; il message e' solo inglese tecnico per i log.
// Il file vecchio (plugin id ritmo-consumo) viene copiato una tantum nella nuova cartella.
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  RitmoConfigSchema,
  type RitmoConfig,
  type RitmoConfigResult,
} from "../shared/contract";

const CONFIG_PATH = join(homedir(), ".paseo", "plugin-data", "usage-pace", "config.json");
const LEGACY_CONFIG_PATH = join(homedir(), ".paseo", "plugin-data", "ritmo-consumo", "config.json");
const DEFAULT_CONFIG: RitmoConfig = { footer: null };

// Se il nuovo file non esiste e quello vecchio si, lo copia. Non cancella l'originale.
async function migrateLegacyConfig(): Promise<void> {
  try {
    await access(CONFIG_PATH);
    return;
  } catch {
    // Il nuovo file non esiste: si prova la copia dal percorso vecchio.
  }
  try {
    await mkdir(dirname(CONFIG_PATH), { recursive: true });
    await copyFile(LEGACY_CONFIG_PATH, CONFIG_PATH, constants.COPYFILE_EXCL);
  } catch {
    // Nessun file vecchio o copia non riuscita: si usano i valori di default.
  }
}

export async function getRitmoConfig(): Promise<RitmoConfigResult> {
  await migrateLegacyConfig();
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = RitmoConfigSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { config: parsed.data, error: null };
    return invalidFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { config: DEFAULT_CONFIG, error: null };
    }
    return invalidFile();
  }
}

export async function setRitmoConfig(input: RitmoConfig): Promise<RitmoConfigResult> {
  await migrateLegacyConfig();
  const parsed = RitmoConfigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      config: DEFAULT_CONFIG,
      error: { code: "invalid_input", message: "The configuration is not valid." },
    };
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
      error: { code: "write_failed", message: "Could not save the configuration." },
    };
  }
}

function invalidFile(): RitmoConfigResult {
  return {
    config: DEFAULT_CONFIG,
    error: { code: "invalid_file", message: "The configuration file cannot be read: using default values." },
  };
}
