export function createExportId(fileUrl: string): string {
  return `bx-${Bun.hash(fileUrl).toString(36)}`;
}
