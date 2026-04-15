import { HeadNode } from "./type";

export function style() {
  let content = "";

  return {
    content(value: string) {
      content = value;
      return this;
    },
    toJSON(): HeadNode {
      return {
        tag: "style",
        content,
      };
    },
  };
}
