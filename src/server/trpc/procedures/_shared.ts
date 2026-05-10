/**
 * CHP Platform — Shared tRPC Procedure Helpers
 *
 * Reusable helpers consumed by multiple admin routers.
 * Extracted from admin-tests.ts to avoid duplication across
 * admin-tests and admin-questions routers.
 */
import { countDistinct, eq } from "drizzle-orm";
import { testSessions } from "../../schema/sessions";

/**
 * Structural interface for the db/tx parameter.
 * Both NeonHttpDatabase and PgAsyncTransaction expose this
 * select→from→where chain. Using a structural type avoids
 * coupling to a specific Drizzle driver type.
 */
type DbClient = (typeof import("../../db"))["db"];
interface DbLike {
  select: (...args: Parameters<DbClient["select"]>) => ReturnType<DbClient["select"]>;
}

/**
 * Fetch session count for a given test. Used across admin routers
 * for structural lock enforcement.
 *
 * Accepts ctx.db or a transaction handle (tx) — both share the same
 * Drizzle select/from/where API surface.
 */
export async function getSessionCount(db: DbLike, testId: string): Promise<number> {
  const [row] = await db
    .select({ count: countDistinct(testSessions.id) })
    .from(testSessions)
    .where(eq(testSessions.testId, testId));
  return Number(row?.count ?? 0);
}
