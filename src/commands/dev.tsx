import { hash } from "../utils/hash";
import { loadConfig } from "../utils/config";
import { getPages } from "../utils/pages";
import { buildPage } from "../utils/buildPage";
import type { ServerWebSocket } from "bun";
import { watch } from "node:fs";
import { resolve } from "node:path";

const config = await loadConfig();

const rootDir = process.cwd();
const srcDir = resolve(rootDir, "src");

const clients = new Set<ServerWebSocket<unknown>>();
const prevHashes = new Map<string, string>();

Bun.serve({
  port: 35729,
  fetch(req, server) {
    if (req.headers.get("upgrade") === "websocket") {
      if (server.upgrade(req)) return;
    }
    return new Response("ok");
  },
  websocket: {
    open(ws) {
      clients.add(ws);
    },
    message() {},
    close(ws) {
      clients.delete(ws);
    },
  },
});

async function buildOne(fullPath: string) {
  try {
    const { bladePath, code, head } = await buildPage(
      fullPath,
      config,
      rootDir,
    );

    const snapshot = JSON.stringify({ head, code });
    const newHash = hash(snapshot);
    const oldHash = prevHashes.get(fullPath);

    const shouldUpdate = !!oldHash && oldHash !== newHash;
    prevHashes.set(fullPath, newHash);

    if (!oldHash) {
      console.log(`✅ Built: ${bladePath}`);
    } else if (oldHash !== newHash) {
      console.log(`🔄 Updated: ${bladePath}`);
    }

    if (shouldUpdate) {
      for (const ws of clients) {
        ws.send(JSON.stringify({ type: "update", code }));
      }
    }
  } catch (error) {
    console.error(`❌ Build failed: ${fullPath}`);
    console.error(error);
  }
}

async function buildAll() {
  const pages = await getPages(config.pagesDir);
  for (const p of pages) {
    await buildOne(resolve(rootDir, p));
  }
}

let timeout: Timer | undefined;

function queueBuild(fn: () => Promise<void>) {
  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(async () => {
    console.log(`⚡ Rebuilding...`);
    await fn();
    console.log(`⚡ Rebuilding finished.`);
  }, 120);
}

watch(srcDir, { recursive: true }, (_eventType, filename) => {
  if (!filename) return;

  let file = String(filename);

  if (!file.includes(".")) return;

  if (file.endsWith("~")) file = file.slice(0, -1);

  console.log(`👀 File changed: ${file}`);

  queueBuild(buildAll);
});

await buildAll();
