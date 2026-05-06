import { createTRPCRouter } from "./index";
import { healthRouter } from "./procedures/health";
import { sessionsRouter } from "./procedures/sessions";
import { resultsRouter } from "./procedures/results";
import { reportRequestsRouter } from "./procedures/report-requests";
import { adminAuthRouter } from "./procedures/admin-auth";
import { adminDashboardRouter } from "./procedures/admin-dashboard";
import { adminResultsRouter } from "./procedures/admin-results";
import { adminTestsRouter } from "./procedures/admin-tests";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  sessions: sessionsRouter,
  results: resultsRouter,
  reportRequests: reportRequestsRouter,
  admin: adminAuthRouter,
  adminDashboard: adminDashboardRouter,
  adminResults: adminResultsRouter,
  adminTests: adminTestsRouter,
});

export type AppRouter = typeof appRouter;
