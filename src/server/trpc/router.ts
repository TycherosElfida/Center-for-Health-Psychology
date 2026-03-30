import { createTRPCRouter } from "./index";
import { healthRouter } from "./procedures/health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  // We will add tests, sessions, and admin routers here later
});

export type AppRouter = typeof appRouter;
