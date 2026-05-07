import { gzipSync } from "bun";
import type { BladeXConfig } from "../types/config";

export function chunkCode(config: BladeXConfig, code: string): string {
  if (config.gzip) {
    const compressed = gzipSync(new TextEncoder().encode(code));
    const base64 = btoa(
      Array.from(compressed, (c) => String.fromCharCode(c)).join(""),
    );

    return `<script>
  (async () => {
      const b = atob("${base64}");
      const u = Uint8Array.from(b, c => c.charCodeAt(0));
      const ds = new DecompressionStream("gzip");
      const w = ds.writable.getWriter();
      w.write(u);
      w.close();
      const code = await new Response(ds.readable).text();
      const blob = new Blob([code], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const s = document.createElement("script");
      s.type = "module";
      s.src = url;
      document.head.appendChild(s);
      s.onload = () => URL.revokeObjectURL(url);
  })();
</script>`;
  } else {
    const CHUNK_SIZE = 50_000;

    const chunks: string[] = [];
    for (let i = 0; i < code.length; i += CHUNK_SIZE) {
      chunks.push(code.slice(i, i + CHUNK_SIZE));
    }

    const phpVars = chunks
      .map(
        (chunk, i) =>
          `@php\n$__bladex_code_${i} = <<<'BLADEX'\n${chunk}\nBLADEX;\n@endphp`,
      )
      .join("\n");

    const concat = chunks.map((_, i) => `$__bladex_code_${i}`).join(" . ");

    return `${phpVars}\n<script type="module">{!! ${concat} !!}</script>`;
  }
}
