/**
 * CHP Platform — Drizzle ORM Relations (v2 API)
 *
 * Uses `defineRelations()` from drizzle-orm@1.0.0-beta.20.
 * This replaces the old `relations()` API from drizzle-orm < 1.0.
 *
 * All tables are passed as the first argument (the schema object),
 * and the callback receives a builder `r` with:
 *   - r.one.<tableName>({ from, to }) — defines a one-to-one/many-to-one link
 *   - r.many.<tableName>()           — defines a one-to-many link (inverse)
 *
 * The result is passed to `drizzle(url, { relations })` in db/index.ts.
 */
import { defineRelations } from "drizzle-orm";
import { tests, questions, options, scoringRules, resultInterpretations } from "./tests";
import { testSessions, answers, results } from "./sessions";
import { consents, guestLeads } from "./consents";
import { adminUsers, auditLogs } from "./admin";
import { users } from "./users";
import { accounts } from "./accounts";
import { authSessions } from "./authSessions";
import { verificationTokens } from "./verificationTokens";

export const relations = defineRelations(
  {
    tests,
    questions,
    options,
    scoringRules,
    resultInterpretations,
    testSessions,
    answers,
    results,
    consents,
    guestLeads,
    adminUsers,
    auditLogs,
    users,
    accounts,
    authSessions,
    verificationTokens,
  },
  (r) => ({
    // ── Test Domain ────────────────────────────────────────────────

    tests: {
      questions: r.many.questions(),
      scoringRules: r.many.scoringRules(),
      resultInterpretations: r.many.resultInterpretations(),
      testSessions: r.many.testSessions(),
      results: r.many.results(),
      guestLeads: r.many.guestLeads(),
    },

    questions: {
      test: r.one.tests({
        from: r.questions.testId,
        to: r.tests.id,
      }),
      options: r.many.options(),
      answers: r.many.answers(),
    },

    options: {
      question: r.one.questions({
        from: r.options.questionId,
        to: r.questions.id,
      }),
    },

    scoringRules: {
      test: r.one.tests({
        from: r.scoringRules.testId,
        to: r.tests.id,
      }),
    },

    resultInterpretations: {
      test: r.one.tests({
        from: r.resultInterpretations.testId,
        to: r.tests.id,
      }),
    },

    // ── Session Domain ─────────────────────────────────────────────

    testSessions: {
      test: r.one.tests({
        from: r.testSessions.testId,
        to: r.tests.id,
      }),
      answers: r.many.answers(),
      result: r.one.results({
        from: r.testSessions.id,
        to: r.results.sessionId,
      }),
      consent: r.one.consents({
        from: r.testSessions.id,
        to: r.consents.sessionId,
      }),
      guestLeads: r.many.guestLeads(),
      // Phase 2: link sessions to authenticated users
      user: r.one.users({
        from: r.testSessions.userId,
        to: r.users.id,
      }),
    },

    answers: {
      session: r.one.testSessions({
        from: r.answers.sessionId,
        to: r.testSessions.id,
      }),
      question: r.one.questions({
        from: r.answers.questionId,
        to: r.questions.id,
      }),
    },

    results: {
      session: r.one.testSessions({
        from: r.results.sessionId,
        to: r.testSessions.id,
      }),
      test: r.one.tests({
        from: r.results.testId,
        to: r.tests.id,
      }),
    },

    // ── Consent Domain ─────────────────────────────────────────────

    consents: {
      session: r.one.testSessions({
        from: r.consents.sessionId,
        to: r.testSessions.id,
      }),
    },

    guestLeads: {
      session: r.one.testSessions({
        from: r.guestLeads.sessionId,
        to: r.testSessions.id,
      }),
      test: r.one.tests({
        from: r.guestLeads.testId,
        to: r.tests.id,
      }),
    },

    // ── Admin Domain ───────────────────────────────────────────────

    adminUsers: {
      auditLogs: r.many.auditLogs(),
    },

    auditLogs: {
      adminUser: r.one.adminUsers({
        from: r.auditLogs.adminUserId,
        to: r.adminUsers.id,
      }),
    },

    // ── Auth Domain (Phase 2) ──────────────────────────────────────

    users: {
      accounts: r.many.accounts(),
      authSessions: r.many.authSessions(),
      testSessions: r.many.testSessions(),
    },

    accounts: {
      user: r.one.users({
        from: r.accounts.userId,
        to: r.users.id,
      }),
    },

    authSessions: {
      user: r.one.users({
        from: r.authSessions.userId,
        to: r.users.id,
      }),
    },

    // verificationTokens have no FK relations — they are standalone
    verificationTokens: {},
  })
);
