export type HeadNode = {
  tag: string;
  attrs?: Record<string, string>;
  content?: string;
};

export type HeadInput = HeadNode | { toJSON(): HeadNode };
