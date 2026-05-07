import { HeadInput } from "../head/type";

const VOID_TAGS = new Set([
  "meta",
  "link",
  "base",
  "br",
  "hr",
  "img",
  "input",
  "source",
  "track",
  "wbr",
]);

export function renderHead(head: HeadInput[]) {
  return head
    .map((item) => {
      const node = "toJSON" in item ? item.toJSON() : item;

      const attrs = Object.entries(node.attrs || {})
        .map(([k, v]) => {
          if (v === "") {
            return k;
          }

          return `${k}="${String(v)}"`;
        })
        .join(" ");

      const attrString = attrs ? ` ${attrs}` : "";

      if (VOID_TAGS.has(node.tag)) {
        return `<${node.tag}${attrString} />`;
      }

      return `<${node.tag}${attrString}>${node.content ?? ""}</${node.tag}>`;
    })
    .join("\n");
}
