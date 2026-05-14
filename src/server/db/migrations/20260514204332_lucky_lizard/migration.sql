CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY,
	"display_name" text,
	"sex" text,
	"age" integer,
	"province" text,
	"city" text,
	"avatar_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;