import { loadConfig } from "../utils/config";
import { buildExport } from "../utils/buildExport";
import { getExports } from "../utils/exports";
import { resolve } from "node:path";

console.log("🏗️ Building all exports...");

const config = await loadConfig();
const rootDir = process.cwd();

const exportsDir = resolve(rootDir, config.exportsDirectory ?? "src/exports");

const files = await getExports(exportsDir);

for (const fullPath of files) {
  try {
    const result = await buildExport(fullPath, config, rootDir);

    if (!result) continue;

    const { bladePath, type } = result;

    if (type === "page") {
      console.log(`✅ Built page: ${bladePath}`);
    } else if (type === "component") {
      console.log(`✅ Built component: ${bladePath}`);
    } else {
      console.log(`✅ Built: ${bladePath}`);
    }
  } catch (error) {
    console.error(`❌ Build failed: ${fullPath}`);
    console.error(error);
  }
}
