import { pathToFileURL } from "bun";
import { relative, resolve } from "node:path";
import type { BladeXConfig } from "../types/config";
import { generateVirtualFile } from "./generateVirtualFile";
import { dataUrlPlugin } from "../plugins/dataUrlPlugin";
import { HeadInput } from "../head/type";
import { resolveOutputPath } from "./resolveOutput";
import { generateBladeComponentView } from "./generateBladeComponentView";
import { generateBladePageView } from "./generateBladePageView";
import { createExportId } from "./exportId";

async function getExternalPackages(rootDir: string): Promise<string[]> {
  try {
    const pkg = await Bun.file(resolve(rootDir, "package.json")).json();
    const deps = Object.keys({
      ...(pkg.dependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
    });
    return deps.flatMap((d) => [d, `${d}/*`]);
  } catch {
    return [];
  }
}

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
  const exportId = createExportId(fileUrl);

  const external = config.esmSh ? await getExternalPackages(rootDir) : [];

  const result = await Bun.build({
    entrypoints: [virtualEntry],
    format: "esm",
    target: "browser",
    minify: true,
    external,

    define: {
      "process.env.NODE_ENV": '"production"',
      __DEV__: "false",
    },

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
      [virtualEntry]: generateVirtualFile(fileUrl, exportId),
    },

    plugins: [dataUrlPlugin],
  });

  let code = await result.outputs[0].text();

  if (config.esmSh) {
    code = code.replace(/from\s*"([^"]+)"/g, (match, p) => {
      if (
        p.startsWith(".") ||
        p.startsWith("/") ||
        p.startsWith("https:") ||
        p.startsWith("node:") ||
        p.startsWith("bun:")
      ) {
        return match;
      }
      return `from"https://esm.sh/${p}"`;
    });
  }

  code = code.replaceAll("</script>", "<\\/script>");

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

    await Bun.write(
      bladePath,
      generateBladePageView(config, head, code, css, exportId),
    );

    return { bladePath, type: "page", head, code, css };
  }

  if (isComponent) {
    const bladePath = resolveOutputPath(
      fullPath,
      resolve(rootDir, config.exportsDirectory ?? "src/exports"),
      config.viewsDirectory ?? "../resources/views",
      "component",
    );

    await Bun.write(
      bladePath,
      generateBladeComponentView(config, code, css, exportId),
    );

    return { bladePath, type: "component", code, css };
  }

  return null;
}
