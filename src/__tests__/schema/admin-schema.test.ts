import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { adminUsers } from "@/server/schema/admin";

describe("adminUsers schema", () => {
  const cols = getTableColumns(adminUsers);

  it("has mustChangePassword column", () => {
    expect(cols.mustChangePassword).toBeDefined();
    expect(cols.mustChangePassword.notNull).toBe(true);
  });

  it("has sessionInvalidatedAt column", () => {
    expect(cols.sessionInvalidatedAt).toBeDefined();
    expect(cols.sessionInvalidatedAt.notNull).toBe(false);
  });
});
