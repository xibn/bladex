import { chunkCode } from "./chunkCode";
import { generateHmrRuntime } from "./generateHmrRuntime";
import type { BladeXConfig } from "../types/config";

export function generateBladeComponentView(
  config: BladeXConfig,
  code: string,
  css: string,
  id: string,
) {
  const cssHtml = css ? `<style id="_bladex_css">${css}</style>` : "";

  return `
<div data-bladex-component wire:ignore>
    <div data-bladex-root></div>

    <script>
        window.__BLADEX_DATA__ = {{ Js::from($__data ?? []) }};
    </script>

    ${cssHtml}

    ${chunkCode(config, code)}

    @if (app()->isLocal())
        <!-- Dev HMR -->
        ${generateHmrRuntime({
          id,
          preserveScroll: false,
        })}
    @endif
</div>
`;
}
