import type { BunPlugin, OnLoadArgs } from "bun";

const mimeMap: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
};

export const dataUrlPlugin: BunPlugin = {
  name: "dataurl-plugin",
  setup(build) {
    build.onLoad(
      { filter: /\.(png|jpg|jpeg|webp|gif|svg|mp4)$/ },
      async (args: OnLoadArgs) => {
        const file = Bun.file(args.path);
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        const ext = args.path.split(".").pop()?.toLowerCase() ?? "";
        const mime = mimeMap[ext] ?? "application/octet-stream";

        return {
          contents: `export default "data:${mime};base64,${base64}"`,
          loader: "js",
        };
      },
    );
  },
};
