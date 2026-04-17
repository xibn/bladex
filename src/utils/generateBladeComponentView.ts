export function generateBladeComponentView(code: string, css: string) {
  const encoded = Buffer.from(code).toString("base64");

  return `
<div data-bladex-component>
    <div data-bladex-root></div>

    <script>
        window.__BLADEX_DATA__ = {{ Js::from($__data ?? []) }};
        const __bladex_code__ = atob("${encoded}");
    </script>

    <script>
        (async () => {
            const component = document.currentScript?.parentElement;
            if (!component) return;

            const root = component.querySelector("[data-bladex-root]");
            if (!root) return;

            const blob = new Blob([__bladex_code__], {
                type: "text/javascript",
            });

            const url = URL.createObjectURL(blob);
            await import(url);
            URL.revokeObjectURL(url);
        })();
    </script>

    ${css ? `<style>${css}</style>` : ""}

    @if (app()->isLocal())
    <script>
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

                const component = document.currentScript?.parentElement;
                if (!component) return;

                if (msg.css !== undefined) {
                    let style = component.querySelector("style");

                    if (!style) {
                        style = document.createElement("style");
                        component.appendChild(style);
                    }

                    style.textContent = msg.css;
                }

                const root = component.querySelector("[data-bladex-root]");
                if (!root) return;

                root.innerHTML = "";

                const newCode = msg.code;

                const blob = new Blob([newCode], {
                    type: "text/javascript",
                });

                const url = URL.createObjectURL(blob);
                await import(url);
                URL.revokeObjectURL(url);
            }
        };
    </script>
    @endif
</div>
`;
}
