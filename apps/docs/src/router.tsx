import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const createAppRouter = () => createRouter({ routeTree, scrollRestoration: true, defaultPreload: "intent" });
type AppRouter = ReturnType<typeof createAppRouter>;
const browserState: { router?: AppRouter } = {};
export const getRouter = () => {
  if (typeof document === "undefined") return createAppRouter();
  browserState.router ??= createAppRouter();
  return browserState.router;
};

declare module "@tanstack/react-router" { interface Register { router: AppRouter } }
