import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./src/server/db/index";
import { results } from "./src/server/schema/sessions";
import { questions, tests } from "./src/server/schema/tests";
import { eq } from "drizzle-orm";

async function main() {
  const res = await db.select().from(results).limit(1);
  console.log("RESULT STRUCTURE:");
  console.log(JSON.stringify(res, null, 2));

  const [test] = await db.select().from(tests).where(eq(tests.slug, "gpius2")).limit(1);
  if (test) {
    const qs = await db
      .select({
        id: questions.id,
        dimension: questions.dimension,
        order: questions.order,
      })
      .from(questions)
      .where(eq(questions.testId, test.id))
      .orderBy(questions.order);

    console.log("\nGPIUS-2 QUESTIONS:");
    console.log(JSON.stringify(qs, null, 2));
  } else {
    console.log("GPIUS-2 test not found");
  }
  process.exit(0);
}
main();
