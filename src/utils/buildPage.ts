import { relative, resolve } from "node:path";
import { pathToFileURL } from "bun";
import { generateBladeView } from "./generateBladeView";
import { generateVirtualFile } from "./generateVirtualFile";
import { resolveOutputPath } from "./resolveOutput";
import { HeadInput } from "../head/type";
import { BladeXConfig } from "./config";

export async function buildPage(
  fullPath: string,
  config: BladeXConfig,
  rootDir: string,
) {
  const virtualEntry = "/virtual-entry.tsx";

  const fileUrl = relative(rootDir, fullPath).replaceAll("\\", "/");

  const result = await Bun.build({
    entrypoints: [virtualEntry],
    format: "esm",
    target: "browser",
    minify: false,

    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".svg": "dataurl",
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    // TODO: remove "as any" when Bun type-bug is fixed

    files: {
      [virtualEntry]: generateVirtualFile(fileUrl),
    },
  });

  const code = await result.outputs[0].text();

  const mod = await import(pathToFileURL(fullPath).href + `?t=${Date.now()}`);

  const head = (mod.head ?? []) as HeadInput[];

  const bladePath = resolveOutputPath(
    fullPath,
    resolve(rootDir, config.pagesDir),
    config.outDir,
    "pages",
  );

  await Bun.write(bladePath, generateBladeView(head, code));

  return { bladePath, code, head };
}
