import { HeadNode } from "./type";

export function link() {
  const attrs: Record<string, string> = {};

  return {
    rel(value: string) {
      attrs.rel = value;
      return this;
    },
    href(value: string) {
      attrs.href = value;
      return this;
    },
    type(value: string) {
      attrs.type = value;
      return this;
    },
    as(value: string) {
      attrs.as = value;
      return this;
    },
    toJSON(): HeadNode {
      return {
        tag: "link",
        attrs,
      };
    },
  };
}
