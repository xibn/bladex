import { HeadInput } from "../head/type";
import { chunkCode } from "./chunkCode";
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

        ${chunkCode(code)}

        @if (app()->isLocal())
            <!-- Dev HMR -->
            <script>
                (() => {
                    const ws =
                        new WebSocket("ws://localhost:35729");

                    let currentUpdateId = 0;
                    let currentRestoreToken = 0;

                    function restoreScrollWhenStable() {
                        const saved =
                            sessionStorage.getItem(
                                "hmr-scroll-y",
                            );

                        if (!saved) {
                            return;
                        }

                        const targetY =
                            parseInt(saved, 10);

                        const token =
                            ++currentRestoreToken;

                        let frame = 0;
                        let stableFrames = 0;
                        let lastHeight = 0;

                        const loop = () => {
                            if (
                                token !==
                                currentRestoreToken
                            ) {
                                return;
                            }

                            frame++;

                            const height =
                                document.documentElement
                                    .scrollHeight;

                            const maxY =
                                Math.max(
                                    0,
                                    height -
                                        window.innerHeight,
                                );

                            if (maxY >= targetY) {
                                window.scrollTo(
                                    0,
                                    targetY,
                                );

                                if (
                                    Math.abs(
                                        window.scrollY -
                                            targetY,
                                    ) < 5
                                ) {
                                    if (
                                        height ===
                                        lastHeight
                                    ) {
                                        stableFrames++;
                                    } else {
                                        stableFrames = 0;
                                    }

                                    if (
                                        stableFrames >= 10
                                    ) {
                                        sessionStorage.removeItem(
                                            "hmr-scroll-y",
                                        );

                                        console.log(
                                            "🔥 HMR scroll restored",
                                            {
                                                targetY,
                                                actualY:
                                                    window.scrollY,
                                                height,
                                            },
                                        );

                                        return;
                                    }
                                }
                            }

                            lastHeight = height;

                            if (frame > 900) {
                                console.warn(
                                    "🔥 HMR scroll restore timeout",
                                    {
                                        targetY,
                                        actualY:
                                            window.scrollY,
                                        height,
                                    },
                                );

                                return;
                            }

                            requestAnimationFrame(
                                loop,
                            );
                        };

                        requestAnimationFrame(loop);
                    }

                    ws.onmessage = async (event) => {
                        let msg;

                        try {
                            msg = JSON.parse(
                                event.data,
                            );
                        } catch {
                            console.warn(
                                "Non-JSON WS message:",
                                event.data,
                            );

                            return;
                        }

                        if (msg.type === "reload") {
                            location.reload();

                            return;
                        }

                        if (msg.type !== "update") {
                            return;
                        }

                        const updateId =
                            ++currentUpdateId;

                        console.log(
                            "🔥 HMR update",
                        );

                        sessionStorage.setItem(
                            "hmr-scroll-y",
                            String(window.scrollY),
                        );

                        if (msg.css !== undefined) {
                            let style =
                                document.getElementById(
                                    "_bladex_css",
                                );

                            if (!style) {
                                style =
                                    document.createElement(
                                        "style",
                                    );

                                style.id =
                                    "_bladex_css";

                                document.head.appendChild(
                                    style,
                                );
                            }

                            style.textContent =
                                msg.css;
                        }

                        try {
                            const blob =
                                new Blob(
                                    [msg.code],
                                    {
                                        type: "text/javascript",
                                    },
                                );

                            const url =
                                URL.createObjectURL(
                                    blob,
                                );

                            try {
                                await import(url);
                            } finally {
                                URL.revokeObjectURL(
                                    url,
                                );
                            }

                            if (
                                updateId !==
                                currentUpdateId
                            ) {
                                return;
                            }

                            requestAnimationFrame(
                                () => {
                                    restoreScrollWhenStable();
                                },
                            );
                        } catch (err) {
                            console.error(
                                "🔥 HMR import failed",
                                err,
                            );
                        }
                    };

                    ws.onopen = () => {
                        console.log(
                            "🔥 HMR connected",
                        );
                    };

                    ws.onclose = () => {
                        console.warn(
                            "🔥 HMR disconnected",
                        );
                    };

                    ws.onerror = (err) => {
                        console.error(
                            "🔥 HMR socket error",
                            err,
                        );
                    };
                })();
            </script>
        @endif
    </body>
</html>`;
}
