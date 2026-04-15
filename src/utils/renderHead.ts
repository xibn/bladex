export function renderHead(head: any[]) {
  return head
    .map((item) => {
      const node = item.toJSON ? item.toJSON() : item;

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
