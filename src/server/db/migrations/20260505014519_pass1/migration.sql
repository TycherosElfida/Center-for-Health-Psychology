CREATE TYPE "scoring_method" AS ENUM('summative', 'dimensional', 'binary_cluster');--> statement-breakpoint
CREATE TYPE "test_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "report_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"result_id" uuid NOT NULL,
	"requester_type" text NOT NULL,
	"encrypted_email" text,
	"user_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_token" text NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text,
	"token" text,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_pkey" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "session_demographics" (
	"session_id" uuid PRIMARY KEY,
	"name" text,
	"sex" text,
	"age" integer,
	"province" text,
	"city" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "weight" numeric(5,2) DEFAULT '1.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "status" "test_status" DEFAULT 'draft'::"test_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "scoring_method" "scoring_method";--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "instructions" text;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "total_score" numeric(10,2);--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "dimension_scores" jsonb;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "result_label" text;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD COLUMN "test_version" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD COLUMN "claim_token" text;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD COLUMN "claim_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "guest_leads" ADD COLUMN "encrypted_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "must_change_password" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "session_invalidated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "ip_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DATA TYPE timestamp with time zone USING "email_verified"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "last_login_at" SET DATA TYPE timestamp with time zone USING "last_login_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "admin_user_id" SET DATA TYPE uuid USING "admin_user_id"::uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "options" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "options" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "options" ALTER COLUMN "question_id" SET DATA TYPE uuid USING "question_id"::uuid;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "test_id" SET DATA TYPE uuid USING "test_id"::uuid;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "test_id" SET DATA TYPE uuid USING "test_id"::uuid;--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "min_score" SET DATA TYPE numeric(10,2) USING "min_score"::numeric(10,2);--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "max_score" SET DATA TYPE numeric(10,2) USING "max_score"::numeric(10,2);--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "version" SET DATA TYPE integer USING "version"::integer;--> statement-breakpoint
ALTER TABLE "result_interpretations" ALTER COLUMN "version" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "scoring_rules" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "scoring_rules" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "scoring_rules" ALTER COLUMN "test_id" SET DATA TYPE uuid USING "test_id"::uuid;--> statement-breakpoint
ALTER TABLE "scoring_rules" ALTER COLUMN "version" SET DATA TYPE integer USING "version"::integer;--> statement-breakpoint
ALTER TABLE "scoring_rules" ALTER COLUMN "version" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "version" SET DATA TYPE integer USING "version"::integer;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "version" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "session_id" SET DATA TYPE uuid USING "session_id"::uuid;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "question_id" SET DATA TYPE uuid USING "question_id"::uuid;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "answered_at" SET DATA TYPE timestamp with time zone USING "answered_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "session_id" SET DATA TYPE uuid USING "session_id"::uuid;--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "test_id" SET DATA TYPE uuid USING "test_id"::uuid;--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "scoring_version" SET DATA TYPE integer USING "scoring_version"::integer;--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "test_id" SET DATA TYPE uuid USING "test_id"::uuid;--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "started_at" SET DATA TYPE timestamp with time zone USING "started_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone USING "completed_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "session_id" SET DATA TYPE uuid USING "session_id"::uuid;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "consented_at" SET DATA TYPE timestamp with time zone USING "consented_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "guest_leads" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "guest_leads" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "guest_leads" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_leads" ALTER COLUMN "session_id" SET DATA TYPE uuid USING "session_id"::uuid;--> statement-breakpoint
ALTER TABLE "guest_leads" ALTER COLUMN "test_id" SET DATA TYPE uuid USING "test_id"::uuid;--> statement-breakpoint
ALTER TABLE "guest_leads" ALTER COLUMN "captured_at" SET DATA TYPE timestamp with time zone USING "captured_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "uq_answers_session_question" UNIQUE("session_id","question_id");--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_claim_token_key" UNIQUE("claim_token");--> statement-breakpoint
CREATE INDEX "idx_options_question_id_order" ON "options" ("question_id","order");--> statement-breakpoint
CREATE INDEX "idx_questions_test_id_order" ON "questions" ("test_id","order");--> statement-breakpoint
CREATE INDEX "idx_result_interp_test_dimension" ON "result_interpretations" ("test_id","dimension");--> statement-breakpoint
CREATE INDEX "idx_scoring_rules_test_id" ON "scoring_rules" ("test_id");--> statement-breakpoint
CREATE INDEX "idx_tests_category" ON "tests" ("category");--> statement-breakpoint
CREATE INDEX "idx_tests_is_published" ON "tests" ("is_published");--> statement-breakpoint
CREATE INDEX "idx_tests_status" ON "tests" ("status");--> statement-breakpoint
CREATE INDEX "idx_tests_is_active" ON "tests" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_answers_session_id" ON "answers" ("session_id");--> statement-breakpoint
CREATE INDEX "idx_results_test_id" ON "results" ("test_id");--> statement-breakpoint
CREATE INDEX "idx_results_created_at" ON "results" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_test_id" ON "test_sessions" ("test_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_status" ON "test_sessions" ("status");--> statement-breakpoint
CREATE INDEX "idx_sessions_test_status" ON "test_sessions" ("test_id","status");--> statement-breakpoint
CREATE INDEX "idx_sessions_started_at" ON "test_sessions" ("started_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "test_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_claim_token" ON "test_sessions" ("claim_token") WHERE claim_token IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_guest_leads_session_id" ON "guest_leads" ("session_id");--> statement-breakpoint
CREATE INDEX "idx_guest_leads_test_id" ON "guest_leads" ("test_id");--> statement-breakpoint
CREATE INDEX "idx_report_requests_session_id" ON "report_requests" ("session_id");--> statement-breakpoint
CREATE INDEX "idx_report_requests_test_id" ON "report_requests" ("test_id");--> statement-breakpoint
CREATE INDEX "idx_report_requests_status" ON "report_requests" ("status");--> statement-breakpoint
CREATE INDEX "idx_report_requests_requested_at" ON "report_requests" ("requested_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin_user_id" ON "audit_logs" ("admin_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id");--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_session_id_test_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guest_leads" ADD CONSTRAINT "guest_leads_session_id_test_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guest_leads" ADD CONSTRAINT "guest_leads_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_session_id_test_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_result_id_results_id_fkey" FOREIGN KEY ("result_id") REFERENCES "results"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_reviewed_by_admin_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_processed_by_admin_users_id_fkey" FOREIGN KEY ("processed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session_demographics" ADD CONSTRAINT "session_demographics_session_id_test_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_admin_user_id_admin_users_id_fkey", ADD CONSTRAINT "audit_logs_admin_user_id_admin_users_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "answers" DROP CONSTRAINT "answers_question_id_questions_id_fkey", ADD CONSTRAINT "answers_question_id_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "results" DROP CONSTRAINT "results_test_id_tests_id_fkey", ADD CONSTRAINT "results_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "test_sessions" DROP CONSTRAINT "test_sessions_test_id_tests_id_fkey", ADD CONSTRAINT "test_sessions_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT;