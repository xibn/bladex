import { HeadInput } from "../head/type";
import { renderHead } from "./renderHead";

export function generateBladePageView(
  head: HeadInput[],
  code: string,
  css: string,
) {
  const headHtml = renderHead(head);
  const cssHtml = css ? `<style id="_bladex_css">${css}</style>` : "";

  return `<!DOCTYPE html>
<html>
    <head>
        ${headHtml}
        ${cssHtml}
    </head>

    <body>
        <div data-bladex-root></div>

        <script>
            window.__BLADEX_DATA__ = {{ Js::from($__data ?? []) }};
        </script>

        @verbatim
        <script type="module">
            ${code}
        </script>
        @endverbatim

        @if (app()->isLocal())
        <!-- Dev HMR -->
        <script>
            const ws = new WebSocket("ws://localhost:35729");

            ws.onmessage = async (event) => {
                let msg;

                try {
                    msg = JSON.parse(event.data);
                } catch {
                    console.warn("Non-JSON WS message:", event.data);
                    return;
                }

                if (msg.type === "update") {
                    console.log("🔥 HMR update");

                    if (msg.css !== undefined) {
                        let style = document.getElementById("_bladex_css");

                        if (!style) {
                            style = document.createElement("style");
                            style.id = "_bladex_css";
                            document.head.appendChild(style);
                        }

                        style.textContent = msg.css;
                    }

                    const root = document.querySelector("[data-bladex-root]");
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
    </body>
</html>`;
}
