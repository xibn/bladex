export function chunkCode(code: string): string {
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
