ALTER TYPE "question_type" ADD VALUE 'linear_scale';--> statement-breakpoint
ALTER TYPE "question_type" ADD VALUE 'binary';--> statement-breakpoint
ALTER TABLE "test_citations" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "research_opt_in" SET DEFAULT false;--> statement-breakpoint
CREATE INDEX "idx_test_citations_type" ON "test_citations" ("type");