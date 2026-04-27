/**
 * CHP Platform — Admin Report Request Procedures
 *
 * Backend-only tRPC procedures for managing the report request queue.
 * Admin UI (EmailRequestsPage) is deferred to Phase 1D.
 *
 * All procedures use `adminProcedure` — requires authenticated admin role.
 */
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, adminProcedure } from "../index";
import { reportRequests } from "@/server/schema/report-requests";
import { tests } from "@/server/schema/tests";

import { users } from "@/server/schema/users";
import { db as dbInstance } from "@/server/db";
import { assembleReportData } from "@/server/reports/assemble";
import { sendReportEmail } from "@/server/reports/send-report";
import { decrypt } from "@/server/utils/encryption";

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

const VALID_STATUSES = ["pending", "reviewed", "sent", "rejected"] as const;

/**
 * Resolve the recipient email address for a report request.
 * - Guest: decrypt the stored encrypted email
 * - Authenticated: look up from users table
 */
async function resolveRecipientEmail(
  request: { requesterType: string; encryptedEmail: string | null; userId: string | null },
  db: typeof dbInstance
): Promise<string> {
  if (request.requesterType === "guest") {
    if (!request.encryptedEmail) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Guest request missing encrypted email",
      });
    }
    return decrypt(request.encryptedEmail);
  }

  if (!request.userId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Authenticated request missing userId",
    });
  }

  const user = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, request.userId))
    .limit(1)
    .then((r) => r[0]);

  if (!user?.email) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User email not found",
    });
  }

  return user.email;
}

/* ═══════════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════════ */

export const reportRequestsRouter = createTRPCRouter({
  /**
   * List report requests with optional filters and pagination.
   */
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(VALID_STATUSES).optional(),
        testId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = [];
      if (input.status) {
        conditions.push(eq(reportRequests.status, input.status));
      }
      if (input.testId) {
        conditions.push(eq(reportRequests.testId, input.testId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await ctx.db
        .select({
          id: reportRequests.id,
          sessionId: reportRequests.sessionId,
          testId: reportRequests.testId,
          resultId: reportRequests.resultId,
          requesterType: reportRequests.requesterType,
          status: reportRequests.status,
          rejectionReason: reportRequests.rejectionReason,
          requestedAt: reportRequests.requestedAt,
          reviewedAt: reportRequests.reviewedAt,
          processedAt: reportRequests.processedAt,
        })
        .from(reportRequests)
        .where(whereClause)
        .orderBy(desc(reportRequests.requestedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(reportRequests)
        .where(whereClause)
        .then((r) => r[0]);

      return { items: rows, total: countResult?.count ?? 0 };
    }),

  /**
   * Get full detail for a single report request, including assembled report data.
   */
  getDetail: adminProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const request = await ctx.db
        .select()
        .from(reportRequests)
        .where(eq(reportRequests.id, input.requestId))
        .limit(1)
        .then((r) => r[0]);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report request not found" });
      }

      // Fetch test name for display
      const test = await ctx.db
        .select({ title: tests.title, slug: tests.slug })
        .from(tests)
        .where(eq(tests.id, request.testId))
        .limit(1)
        .then((r) => r[0]);

      return {
        ...request,
        testName: test?.title ?? "Unknown",
        testSlug: test?.slug ?? "unknown",
      };
    }),

  /**
   * Mark a report request as reviewed (optional step before approve/reject).
   */
  markReviewed: adminProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db
        .select({ status: reportRequests.status })
        .from(reportRequests)
        .where(eq(reportRequests.id, input.requestId))
        .limit(1)
        .then((r) => r[0]);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report request not found" });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot review request in '${request.status}' status`,
        });
      }

      await ctx.db
        .update(reportRequests)
        .set({
          status: "reviewed",
          reviewedBy: ctx.session.userId,
          reviewedAt: new Date(),
        })
        .where(eq(reportRequests.id, input.requestId));

      return { success: true };
    }),

  /**
   * Approve a report request: generate PDF, send email, update status.
   */
  approve: adminProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db
        .select()
        .from(reportRequests)
        .where(eq(reportRequests.id, input.requestId))
        .limit(1)
        .then((r) => r[0]);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report request not found" });
      }

      if (request.status === "sent") {
        return { success: true, alreadySent: true };
      }

      if (request.status === "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot approve a rejected request",
        });
      }

      // 1. Resolve recipient email
      const recipientEmail = await resolveRecipientEmail(request, ctx.db);

      // 2. Assemble report data
      const reportData = await assembleReportData(request.resultId);

      // 3. Send email with PDF
      const { emailId } = await sendReportEmail(recipientEmail, reportData);

      // 4. Update status
      await ctx.db
        .update(reportRequests)
        .set({
          status: "sent",
          processedBy: ctx.session.userId,
          processedAt: new Date(),
        })
        .where(eq(reportRequests.id, input.requestId));

      return { success: true, alreadySent: false, emailId };
    }),

  /**
   * Reject a report request with an optional reason.
   */
  reject: adminProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db
        .select({ status: reportRequests.status })
        .from(reportRequests)
        .where(eq(reportRequests.id, input.requestId))
        .limit(1)
        .then((r) => r[0]);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report request not found" });
      }

      if (request.status === "sent") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reject an already sent request",
        });
      }

      await ctx.db
        .update(reportRequests)
        .set({
          status: "rejected",
          rejectionReason: input.reason ?? null,
          processedBy: ctx.session.userId,
          processedAt: new Date(),
        })
        .where(eq(reportRequests.id, input.requestId));

      return { success: true };
    }),

  /**
   * Batch approve multiple report requests.
   * Processes sequentially — partial failures are reported per item.
   */
  batchApprove: adminProcedure
    .input(z.object({ requestIds: z.array(z.string().uuid()).min(1).max(50) }))
    .mutation(async ({ input, ctx }) => {
      const results: Array<{
        requestId: string;
        success: boolean;
        error?: string;
        emailId?: string;
      }> = [];

      for (const requestId of input.requestIds) {
        try {
          const request = await ctx.db
            .select()
            .from(reportRequests)
            .where(eq(reportRequests.id, requestId))
            .limit(1)
            .then((r) => r[0]);

          if (!request) {
            results.push({ requestId, success: false, error: "Not found" });
            continue;
          }

          if (request.status === "sent") {
            results.push({ requestId, success: true, error: "Already sent" });
            continue;
          }

          if (request.status === "rejected") {
            results.push({ requestId, success: false, error: "Cannot approve rejected request" });
            continue;
          }

          const recipientEmail = await resolveRecipientEmail(request, ctx.db);
          const reportData = await assembleReportData(request.resultId);
          const { emailId } = await sendReportEmail(recipientEmail, reportData);

          await ctx.db
            .update(reportRequests)
            .set({
              status: "sent",
              processedBy: ctx.session.userId,
              processedAt: new Date(),
            })
            .where(eq(reportRequests.id, requestId));

          results.push({ requestId, success: true, emailId });
        } catch (err) {
          results.push({
            requestId,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return {
        total: input.requestIds.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),

  /**
   * Get request count grouped by status (for admin dashboard badges).
   */
  stats: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        status: reportRequests.status,
        count: sql<number>`count(*)::int`,
      })
      .from(reportRequests)
      .groupBy(reportRequests.status);

    const stats: Record<string, number> = {
      pending: 0,
      reviewed: 0,
      sent: 0,
      rejected: 0,
    };

    for (const row of rows) {
      stats[row.status] = row.count;
    }

    return stats;
  }),
});
