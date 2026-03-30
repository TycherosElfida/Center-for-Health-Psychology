/**
 * CHP Platform — Schema Barrel Export
 *
 * Re-exports all tables, enums, and relations from a single entry point.
 * Import as: import * as schema from "@/server/schema";
 *
 * The Drizzle client at `src/server/db/index.ts` passes:
 *   - `schema` (tables) for type inference
 *   - `relations` (via defineRelations v2) for the relational query API
 */
export * from "./enums";
export * from "./tests";
export * from "./sessions";
export * from "./consents";
export * from "./admin";
export * from "./users";
export * from "./relations";
