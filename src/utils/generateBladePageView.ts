import { HeadInput } from "../head/type";
import { chunkCode } from "./chunkCode";
import { generateHmrRuntime } from "./generateHmrRuntime";
import { renderHead } from "./renderHead";
import type { BladeXConfig } from "../types/config";

export function generateBladePageView(
  config: BladeXConfig,
  head: HeadInput[],
  code: string,
  css: string,
  id: string,
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

        ${chunkCode(config, code)}

        @if (app()->isLocal())
            <!-- Dev HMR -->
            ${generateHmrRuntime({
              id,
              preserveScroll: true,
            })}
        @endif
    </body>
</html>`;
}
