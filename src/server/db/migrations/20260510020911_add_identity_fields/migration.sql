ALTER TABLE "tests" ADD COLUMN "abbreviation" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "release_year" integer;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "category" SET DEFAULT '';