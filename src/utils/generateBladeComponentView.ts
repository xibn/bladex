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
@php
    $__bladexInstance = str_replace('.', '-', uniqid('bx-', true));
@endphp
<div
    data-bladex-component
    data-bladex-export="${id}"
    data-bladex-instance="{{ $__bladexInstance }}"
    data-bladex-state="pending"
    wire:ignore
>
    <script type="application/json" data-bladex-props>@json($__data ?? [])</script>
    <div data-bladex-root></div>

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
