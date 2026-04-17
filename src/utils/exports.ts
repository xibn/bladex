import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function getExports(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const full = resolve(current, entry.name);

      if (entry.isDirectory()) {
        await walk(full);
      } else if (
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".jsx") ||
        entry.name.endsWith(".js")
      ) {
        files.push(full);
      }
    }
  }

  await walk(dir);

  return files;
}
