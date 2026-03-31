import { createTRPCRouter } from "./index";
import { healthRouter } from "./procedures/health";
import { sessionsRouter } from "./procedures/sessions";
import { resultsRouter } from "./procedures/results";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  sessions: sessionsRouter,
  results: resultsRouter,
});

export type AppRouter = typeof appRouter;
