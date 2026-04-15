export function generateVirtualFile(fileUrl: string) {
  return `
    import React from "react";
    import { createRoot } from "react-dom/client";
    import Page from "${fileUrl}";

    const el = document.getElementById("app");
    if (el) {
        createRoot(el).render(React.createElement(Page));
    }

    export * from "${fileUrl}";
  `;
}
