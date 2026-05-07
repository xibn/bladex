import { HeadInput } from "../head/type";
import { chunkCode } from "./chunkCode";
import { generateHmrRuntime } from "./generateHmrRuntime";
import { renderHead } from "./renderHead";

export function generateBladePageView(
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

        ${chunkCode(code)}

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
