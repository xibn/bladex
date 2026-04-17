import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import type { BladeXConfig } from "../types/config";

const defaultConfig: BladeXConfig = {
  viewsDirectory: "../resources/views",
  exportsDirectory: "src/exports",
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
