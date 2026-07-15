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
        @php
            $__bladexInstance = str_replace('.', '-', uniqid('bx-', true));
        @endphp
        <div
            data-bladex-component
            data-bladex-page
            data-bladex-export="${id}"
            data-bladex-instance="{{ $__bladexInstance }}"
            data-bladex-state="pending"
        >
            <script type="application/json" data-bladex-props>@json($__data ?? [])</script>
            <div data-bladex-root></div>
        </div>

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
