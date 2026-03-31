import { createTRPCRouter } from "./index";
import { healthRouter } from "./procedures/health";
import { sessionsRouter } from "./procedures/sessions";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  sessions: sessionsRouter,
  // We will add tests and admin routers here later
});

export type AppRouter = typeof appRouter;
