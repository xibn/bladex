import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export type BladeXConfig = {
  pagesDir: string;
  outDir: string;
};

const defaultConfig: BladeXConfig = {
  pagesDir: "src/pages",
  outDir: "resources/views/generated",
};

export async function loadConfig(): Promise<BladeXConfig> {
  const configPath = resolve(process.cwd(), "bladex.config.ts");

  try {
    const mod = await import(
      pathToFileURL(configPath).href + `?t=${Date.now()}`
    );

    const userConfig = mod.default ?? {};

    return {
      ...defaultConfig,
      ...userConfig,
    };
  } catch {
    return defaultConfig;
  }
}
