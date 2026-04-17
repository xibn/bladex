export function defineComponent<T>(config: { component: () => T }) {
  return {
    ...config,
    __bladex_component: true as const,
  };
}
