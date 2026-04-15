import { getPages } from "../utils/pages";
import { loadConfig } from "../utils/config";
import { buildPage } from "../utils/buildPage";
import { resolve } from "node:path";

const config = await loadConfig();
const rootDir = process.cwd();

const pages = await getPages(config.pagesDir);

for (const p of pages) {
  const fullPath = resolve(rootDir, p);

  const { bladePath } = await buildPage(fullPath, config, rootDir);

  console.log("✅ Built", bladePath);
}
