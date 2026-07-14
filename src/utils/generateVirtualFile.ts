export function generateVirtualFile(fileUrl: string) {
  return `
    import React from "react";
    import { createRoot } from "react-dom/client";
    import * as mod from "${fileUrl}";

    const BladeXExport = mod?.default;
    const Page = BladeXExport?.component;
    const bladeXExportKey = ${JSON.stringify(fileUrl)};
    const bladeXHandlerKey = "__bladex_mount_" + bladeXExportKey;
    const bladeXRootsKey = "__bladex_roots_" + bladeXExportKey;

    if (!Page) {
      console.error("BladeX Debug:", mod);
      throw new Error("Invalid BladeX page: missing component()");
    }

    function mountRoot(el) {
      if (!el.__bladexRoot) {
        el.__bladexRoot = createRoot(el);
        el.dataset.bladexMounted = "true";
      }

      el.__bladexRoot.render(<Page />);
    }

    const mount = BladeXExport.__bladex_component ? () => {
      const queue = window.__BLADEX_COMPONENT_QUEUES__?.[bladeXExportKey];
      const containers = window[bladeXRootsKey] ||= [];

      while (queue?.length) {
        const container = queue.shift();

        if (!containers.includes(container)) {
          containers.push(container);
        }
      }

      window[bladeXRootsKey] = containers.filter((container) => {
        if (!document.contains(container)) {
          return false;
        }

        const el = container.querySelector("[data-bladex-root]");

        if (el) {
          mountRoot(el);
        }

        return true;
      });
    } : () => {
      const el = document.querySelector("[data-bladex-root]");

      if (el) {
        mountRoot(el);
      }
    };

    mount();

    if (window[bladeXHandlerKey]) {
      document.removeEventListener("livewire:navigated", window[bladeXHandlerKey]);
    }

    window[bladeXHandlerKey] = mount;
    document.addEventListener("livewire:navigated", mount);

    export * from "${fileUrl}";
  `;
}
