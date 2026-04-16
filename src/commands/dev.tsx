import { hash } from "../utils/hash";
import { loadConfig } from "../utils/config";
import { getPages } from "../utils/pages";
import { buildPage } from "../utils/buildPage";
import type { ServerWebSocket } from "bun";
import { watch } from "node:fs";
import { resolve } from "node:path";

const config = await loadConfig();

const rootDir = process.cwd();
const pagesDir = resolve(rootDir, config.pagesDir);
const configFile = resolve(rootDir, "bladex.config.ts");

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
  const { bladePath, code, head } = await buildPage(fullPath, config, rootDir);

  const snapshot = JSON.stringify({ head, code });
  const newHash = hash(snapshot);
  const oldHash = prevHashes.get(fullPath);

  const shouldUpdate = !!oldHash && oldHash !== newHash;
  prevHashes.set(fullPath, newHash);

  console.log(`✅ Synced ${bladePath}`);

  if (shouldUpdate) {
    for (const ws of clients) {
      ws.send(JSON.stringify({ type: "update", code }));
    }
  }
}

async function buildAll() {
  const pages = await getPages(config.pagesDir);
  for (const p of pages) {
    await buildOne(resolve(rootDir, p));
  }
}

let timeout: Timer | undefined;

function queueBuild(fn: () => Promise<void>, label: string) {
  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(async () => {
    console.log(`⚡ Rebuilding (${label})...`);
    await fn();
  }, 120);
}

watch(pagesDir, { recursive: true }, (_eventType, filename) => {
  if (!filename) return;

  let file = String(filename);

  if (file.endsWith("~")) file = file.slice(0, -1);
  if (!file.endsWith(".tsx")) return;

  const fullPath = resolve(pagesDir, file);

  console.log(`👀 page changed: ${file}`);

  queueBuild(() => buildOne(fullPath), file);
});

try {
  watch(configFile, () => {
    console.log("👀 config changed");
    queueBuild(buildAll, "config");
  });
} catch {
  // ignore
}

await buildAll();
