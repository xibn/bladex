import { HeadNode } from "./type";

export function title() {
  let content = "";

  return {
    content(value: string) {
      content = value;
      return this;
    },
    toJSON(): HeadNode {
      return {
        tag: "title",
        content,
      };
    },
  };
}
