export function generateVirtualFile(fileUrl: string) {
  return `
    import React from "react";
    import { createRoot } from "react-dom/client";
    import * as mod from "${fileUrl}";

    const Page = mod?.default?.component;

    if (!Page) {
      console.error("BladeX Debug:", mod);
      throw new Error("Invalid BladeX page: missing component()");
    }

    const el = document.querySelector("[data-bladex-root]");

    if (el) {
      const root = createRoot(el);
      root.render(<Page />);
    }

    export * from "${fileUrl}";
  `;
}
