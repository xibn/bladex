import type { BladeXConfig } from "./types/config";

const bladeXDataContextKey = Symbol.for("bladex.dataContext");
const bladeXReactKey = Symbol.for("bladex.react");

type BladeXReact = {
  createContext(defaultValue: unknown): unknown;
  useContext<T>(context: unknown): T;
};

type BladeXGlobal = typeof globalThis & {
  [bladeXDataContextKey]?: unknown;
  [bladeXReactKey]?: BladeXReact;
  __BLADEX_DATA__?: unknown;
};

function getBladeXDataContext(react?: BladeXReact): unknown {
  const global = globalThis as BladeXGlobal;

  if (!global[bladeXDataContextKey] && react) {
    global[bladeXDataContextKey] = react.createContext(undefined);
  }

  return global[bladeXDataContextKey];
}

export function useBladeData<T = unknown>(): T {
  if (typeof window === "undefined") return {} as T;

  const global = globalThis as BladeXGlobal;
  const react = global[bladeXReactKey];
  const context = getBladeXDataContext(react);
  const value =
    react && context ? react.useContext<unknown>(context) : undefined;

  return (value ?? global.__BLADEX_DATA__ ?? {}) as T;
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
