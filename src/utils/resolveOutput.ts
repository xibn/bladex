import { relative } from "path";

export function resolveOutputPath(
  fullPath: string,
  baseDir: string,
  outDir: string,
  type: "pages" | "components",
) {
  const rel = relative(baseDir, fullPath)
    .replace(/\.tsx$/, "")
    .replace(/index$/, "");

  const final = rel === "" ? "index" : rel;

  return `${outDir}/bladex/${type}/${final}.blade.php`;
}
