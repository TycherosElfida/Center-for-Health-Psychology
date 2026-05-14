import { db } from "./src/server/db";
import { tests } from "./src/server/schema";

async function main() {
  const result = await db.select({ slug: tests.slug, thumb: tests.thumbnailUrl }).from(tests);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
main();
