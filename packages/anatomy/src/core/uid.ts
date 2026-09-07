const state = { counter: 0 };

export const uid = (): string => {
  state.counter += 1;
  return crypto.randomUUID?.() ?? `node-${state.counter}-${Date.now()}`;
};
