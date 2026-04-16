import { HeadInput } from "../head/type";
import { renderHead } from "./renderHead";

export function generateBladeView(
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
        <div id="app"></div>

        <script>
            window.__BLADEX_DATA__ = {{ Js::from($__data ?? []) }};
        </script>

        @verbatim
            <script type="module">
                ${code}
            </script>
        @endverbatim

        @if (app()->isLocal())
            <!--This script tag is only used for local development and should not be visible if this Blade view is opened in production.-->
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

                        const el = document.getElementById("app");
                        if (!el) return;

                        el.innerHTML = "";

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
            <!--This script tag is only used for local development and should not be visible if this Blade view is opened in production.-->
        @endif
    </body>
</html>`;
}
