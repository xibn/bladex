import { relative } from "path";

export function resolveOutputPath(
  fullPath: string,
  baseDir: string,
  outDir: string,
  type: "page" | "component",
) {
  const rel = relative(baseDir, fullPath)
    .replaceAll("\\", "/")
    .replace(".tsx", "")
    .replace(".jsx", "")
    .replace(".ts", "")
    .replace(".js", "");

  let componentDir = "";
  if (type === "component") {
    componentDir = "/components";
  }

  return `${outDir}${componentDir}/bladex/${rel}.blade.php`;
}
