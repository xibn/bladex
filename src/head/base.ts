import { HeadNode } from "./type";

export function base() {
  const attrs: Record<string, string> = {};

  return {
    href(value: string) {
      attrs.href = value;
      return this;
    },
    target(value: string) {
      attrs.target = value;
      return this;
    },
    toJSON(): HeadNode {
      return {
        tag: "base",
        attrs,
      };
    },
  };
}
