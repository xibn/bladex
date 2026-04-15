import { Glob } from "bun";

export async function getPages(pagesDir: string): Promise<string[]> {
  const glob = new Glob(`${pagesDir}/**/*.tsx`);
  return Array.fromAsync(glob.scan("."));
}
