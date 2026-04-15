export function toBladePath(fullPath: string) {
  return fullPath
    .replace("resources/frontend/pages/", "")
    .replace(/index\.tsx$/, "")
    .replace(/\.tsx$/, "");
}
