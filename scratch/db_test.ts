import { db } from "../src/server/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(
    sql`SELECT q.id, q.question_text, o.label, o.value, o.order 
        FROM questions q 
        JOIN options o ON o.question_id = q.id 
        WHERE q.id = (SELECT id FROM questions LIMIT 1) 
        ORDER BY o.order;`
  );
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

main().catch(console.error);
