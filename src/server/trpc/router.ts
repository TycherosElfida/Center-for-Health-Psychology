import { createTRPCRouter } from "./index";
import { healthRouter } from "./procedures/health";
import { sessionsRouter } from "./procedures/sessions";
import { resultsRouter } from "./procedures/results";
import { reportRequestsRouter } from "./procedures/report-requests";
import { publicTestsRouter } from "./procedures/public-tests";
import { adminAuthRouter } from "./procedures/admin-auth";
import { adminDashboardRouter } from "./procedures/admin-dashboard";
import { adminResultsRouter } from "./procedures/admin-results";
import { adminTestsRouter } from "./procedures/admin-tests";
import { adminQuestionsRouter } from "./procedures/admin-questions";
import { adminScalesRouter } from "./procedures/admin-scales";
import { adminAccountsRouter } from "./procedures/admin-accounts";
import { adminUserAccountsRouter } from "./procedures/admin-user-accounts";
import { adminAuditRouter } from "./procedures/admin-audit";
import { adminProfileRouter } from "./procedures/admin-profile";
import { profileRouter } from "./procedures/profile";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  sessions: sessionsRouter,
  results: resultsRouter,
  reportRequests: reportRequestsRouter,
  publicTests: publicTestsRouter,
  admin: adminAuthRouter,
  adminDashboard: adminDashboardRouter,
  adminResults: adminResultsRouter,
  adminTests: adminTestsRouter,
  adminQuestions: adminQuestionsRouter,
  adminScales: adminScalesRouter,
  adminAccounts: adminAccountsRouter,
  adminUserAccounts: adminUserAccountsRouter,
  adminAudit: adminAuditRouter,
  adminProfile: adminProfileRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
