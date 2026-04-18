import { pathToFileURL } from "bun";
import { relative, resolve } from "node:path";
import type { BladeXConfig } from "../types/config";
import { generateVirtualFile } from "./generateVirtualFile";
import { dataUrlPlugin } from "../plugins/dataUrlPlugin";
import { HeadInput } from "../head/type";
import { resolveOutputPath } from "./resolveOutput";
import { generateBladeComponentView } from "./generateBladeComponentView";
import { generateBladePageView } from "./generateBladePageView";

export async function buildExport(
  fullPath: string,
  config: BladeXConfig,
  rootDir: string,
) {
  const mod = await import(pathToFileURL(fullPath).href + `?t=${Date.now()}`);

  const isPage = mod.default?.__bladex_page;
  const isComponent = mod.default?.__bladex_component;

  if (!isPage && !isComponent) {
    return null;
  }

  const virtualEntry = "/virtual-entry.tsx";

  const fileUrl = relative(rootDir, fullPath).replaceAll("\\", "/");

  const result = await Bun.build({
    entrypoints: [virtualEntry],
    format: "esm",
    target: "browser",
    minify: true,

    loader: {
      ".tsx": "tsx",
      ".jsx": "jsx",
      ".ts": "ts",
      ".js": "js",
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".jpeg": "dataurl",
      ".webp": "dataurl",
      ".gif": "dataurl",
      ".svg": "dataurl",
      ".mp4": "dataurl",
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    // TODO: remove "as any" when Bun type-bug is fixed

    files: {
      [virtualEntry]: generateVirtualFile(fileUrl),
    },

    plugins: [dataUrlPlugin],
  });

  const code = (await result.outputs[0].text()).replaceAll(
    "</script>",
    "<\\/script>",
  );

  let css = "";

  for (const output of result.outputs) {
    if (output.path.endsWith(".css")) {
      css += await output.text();
    }
  }

  if (isPage) {
    const head = (mod.default.head ?? []) as HeadInput[];

    const bladePath = resolveOutputPath(
      fullPath,
      resolve(rootDir, config.exportsDirectory ?? "src/exports"),
      config.viewsDirectory ?? "../resources/views",
      "page",
    );

    await Bun.write(bladePath, generateBladePageView(head, code, css));

    return { bladePath, type: "page", head, code, css };
  }

  if (isComponent) {
    const bladePath = resolveOutputPath(
      fullPath,
      resolve(rootDir, config.exportsDirectory ?? "src/exports"),
      config.viewsDirectory ?? "../resources/views",
      "component",
    );

    await Bun.write(bladePath, generateBladeComponentView(code, css));

    return { bladePath, type: "component", code, css };
  }

  return null;
}
