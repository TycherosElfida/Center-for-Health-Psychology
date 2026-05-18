CREATE TABLE "test_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"test_id" uuid NOT NULL,
	"type" text NOT NULL,
	"citation" text NOT NULL,
	"doi" text,
	"year" integer,
	"url" text
);
--> statement-breakpoint
CREATE INDEX "idx_test_citations_test_id" ON "test_citations" ("test_id");--> statement-breakpoint
ALTER TABLE "test_citations" ADD CONSTRAINT "test_citations_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE;