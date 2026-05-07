import { chunkCode } from "./chunkCode";
import { generateHmrRuntime } from "./generateHmrRuntime";

export function generateBladeComponentView(code: string, css: string) {
  const cssHtml = css ? `<style id="_bladex_css">${css}</style>` : "";

  return `
<div data-bladex-component wire:ignore>
    <div data-bladex-root></div>

    <script>
        window.__BLADEX_DATA__ = {{ Js::from($__data ?? []) }};
    </script>

    ${cssHtml}

    ${chunkCode(code)}

    @if (app()->isLocal())
        <!-- Dev HMR -->
        ${generateHmrRuntime({
          preserveScroll: false,
        })}
    @endif
</div>
`;
}
