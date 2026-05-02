import { chunkCode } from "./chunkCode";

export function generateBladeComponentView(code: string, css: string) {
  const cssHtml = css ? `<style id="_bladex_css">${css}</style>` : "";

  return `
<div data-bladex-component>
    <div data-bladex-root></div>

    <script>
        window.__BLADEX_DATA__ = {{ Js::from($__data ?? []) }};
    </script>

    ${cssHtml}

    ${chunkCode(code)}

    @if (app()->isLocal())
    <script>
        const __bladex_component = document.currentScript.parentElement;
        const ws = new WebSocket("ws://localhost:35729");

        ws.onmessage = async (event) => {
            let msg;

            try {
                msg = JSON.parse(event.data);
            } catch {
                return;
            }

            if (msg.type === "update") {
                console.log("🔥 Component HMR update");

                if (msg.css !== undefined) {
                    let style = __bladex_component.querySelector("style");

                    if (!style) {
                        style = document.createElement("style");
                        __bladex_component.appendChild(style);
                    }

                    style.textContent = msg.css;
                }

                const root = __bladex_component.querySelector("[data-bladex-root]");
                if (!root) return;

                root.innerHTML = "";

                const blob = new Blob([msg.code], { type: "text/javascript" });
                const url = URL.createObjectURL(blob);

                await import(url);

                URL.revokeObjectURL(url);
            }

            if (msg.type === "reload") {
                location.reload();
            }
        };
    </script>
    @endif
</div>
`;
}
