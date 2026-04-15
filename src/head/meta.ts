import { HeadNode } from "./type";

export function meta() {
  const attrs: Record<string, string> = {};

  return {
    name(value: string) {
      attrs.name = value;
      return this;
    },
    content(value: string) {
      attrs.content = value;
      return this;
    },
    charset(value: string) {
      attrs.charset = value;
      return this;
    },
    httpEquiv(value: string) {
      attrs["http-equiv"] = value;
      return this;
    },
    property(value: string) {
      attrs.property = value;
      return this;
    },
    toJSON(): HeadNode {
      return {
        tag: "meta",
        attrs,
      };
    },
  };
}
