import { hash } from "../utils/hash";
import { loadConfig } from "../utils/config";
import { getExports } from "../utils/exports";
import { buildExport } from "../utils/buildExport";
import type { ServerWebSocket } from "bun";
import { watch } from "node:fs";
import { resolve } from "node:path";

console.log("⚡ Starting development server...");

const config = await loadConfig();
const rootDir = process.cwd();
const srcDir = resolve(rootDir, "src");

const exportsDir = resolve(rootDir, config.exportsDirectory ?? "src/exports");

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
    const result = await buildExport(fullPath, config, rootDir);
    if (!result) return;
    const { bladePath, head, code, css } = result;

    const snapshot = JSON.stringify({ head, code, css });

    const newHash = hash(snapshot);
    const oldHash = prevHashes.get(fullPath);

    const shouldUpdate = !!oldHash && oldHash !== newHash;
    prevHashes.set(fullPath, newHash);

    if (!oldHash) {
      console.log(`✅ Built ${result.type}: ${bladePath}`);
    } else if (oldHash !== newHash) {
      console.log(`🔄 Updated ${result.type}: ${bladePath}`);
    }

    if (shouldUpdate) {
      for (const ws of clients) {
        ws.send(JSON.stringify({ type: "update", code, css }));
      }
    }
  } catch (error) {
    console.error(`❌ Build failed: ${fullPath}`);
    console.error(error);
  }
}

async function buildAll() {
  const files = await getExports(exportsDir);

  for (const fullPath of files) {
    await buildOne(fullPath);
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

console.log("🏗️ Building all exports...");
await buildAll();
