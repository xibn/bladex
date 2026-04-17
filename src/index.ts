import type { BladeXConfig } from "./types/config";

export function useBladeData<T = unknown>(): T {
  if (typeof window === "undefined") return {} as T;

  return (
    (window as unknown as { __BLADEX_DATA__?: T }).__BLADEX_DATA__ ?? ({} as T)
  );
}

export { title } from "./head/title";
export { meta } from "./head/meta";
export { link } from "./head/link";
export { script } from "./head/script";
export { style } from "./head/style";
export { base } from "./head/base";

export function setPageTitle(title: string): void {
  if (typeof document === "undefined") return;

  let el = document.querySelector("title");

  if (!el) {
    el = document.createElement("title");
    document.head.appendChild(el);
  }

  el.textContent = title;
}

export function bladeVar(varName: string): string {
  return `{{ $${varName} }}`;
}

export { definePage } from "./utils/definePage";
export { defineComponent } from "./utils/defineComponent";

export function defineConfig<T extends BladeXConfig>(config: T): T {
  return config;
}
