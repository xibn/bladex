import { HeadInput } from "../head/type";

type Component = () => unknown;

export function definePage(config: {
  head?: HeadInput[];
  component: Component;
}) {
  return {
    __bladex_page: true as const,
    ...config,
  };
}
