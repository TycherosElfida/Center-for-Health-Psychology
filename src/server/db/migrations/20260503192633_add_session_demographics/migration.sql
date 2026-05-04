CREATE TABLE IF NOT EXISTS "session_demographics" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"sex" text,
	"age" integer,
	"province" text,
	"city" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_demographics" ADD CONSTRAINT "session_demographics_session_id_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions"("id") ON DELETE cascade ON UPDATE no action;