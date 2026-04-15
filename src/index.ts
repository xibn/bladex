export { defineConfig } from "./config";
export type { BladeXConfig } from "./config";

export function useBladeData<T = any>(): T {
  if (typeof window === "undefined") return {} as T;
  return (window as any).__BLADEX_DATA__ || {};
}

export { title } from "./head/title";
export { meta } from "./head/meta";
export { link } from "./head/link";
export { script } from "./head/script";
export { style } from "./head/style";
export { base } from "./head/base";
