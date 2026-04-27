import { createTRPCRouter } from "./index";
import { healthRouter } from "./procedures/health";
import { sessionsRouter } from "./procedures/sessions";
import { resultsRouter } from "./procedures/results";
import { reportRequestsRouter } from "./procedures/report-requests";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  sessions: sessionsRouter,
  results: resultsRouter,
  reportRequests: reportRequestsRouter,
});

export type AppRouter = typeof appRouter;
