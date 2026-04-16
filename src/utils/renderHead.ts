import { HeadInput } from "../head/type";

export function renderHead(head: HeadInput[]) {
  return head
    .map((item) => {
      const node = "toJSON" in item ? item.toJSON() : item;

      if (node.tag === "title") {
        return `<title>${node.content ?? ""}</title>`;
      }

      const attrs = Object.entries(node.attrs || {})
        .map(([k, v]) => (v ? `${k}="${v}"` : k))
        .join(" ");

      if (node.content) {
        return `<${node.tag} ${attrs}>${node.content}</${node.tag}>`;
      }

      return `<${node.tag} ${attrs}>`;
    })
    .join("\n");
}
