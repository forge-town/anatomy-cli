export default {
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "node" },
};
