import { HeadNode } from "./type";

export function script() {
  const attrs: Record<string, string> = {};
  let content = "";

  return {
    src(value: string) {
      attrs.src = value;
      return this;
    },
    type(value: string) {
      attrs.type = value;
      return this;
    },
    defer() {
      attrs.defer = "";
      return this;
    },
    async() {
      attrs.async = "";
      return this;
    },
    content(value: string) {
      content = value;
      return this;
    },
    toJSON(): HeadNode {
      return {
        tag: "script",
        attrs,
        content,
      };
    },
  };
}
