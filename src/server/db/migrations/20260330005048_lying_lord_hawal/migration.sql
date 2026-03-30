CREATE TYPE "admin_role" AS ENUM('super_admin', 'admin', 'psychiatrist', 'researcher');--> statement-breakpoint
CREATE TYPE "scoring_algorithm" AS ENUM('summative', 'weighted', 'reversed', 'dimensional', 'percentile');--> statement-breakpoint
CREATE TYPE "question_type" AS ENUM('likert_5', 'likert_7', 'multiple_choice', 'slider', 'multi_select');--> statement-breakpoint
CREATE TYPE "severity_level" AS ENUM('low', 'moderate', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text,
	"email" text NOT NULL UNIQUE,
	"emailVerified" timestamp,
	"image" text,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin'::"admin_role" NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY,
	"admin_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" text PRIMARY KEY,
	"question_id" text NOT NULL,
	"order" integer NOT NULL,
	"label" text NOT NULL,
	"value" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY,
	"test_id" text NOT NULL,
	"order" integer NOT NULL,
	"text" text NOT NULL,
	"type" "question_type" NOT NULL,
	"dimension" text,
	"is_reversed" boolean DEFAULT false NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result_interpretations" (
	"id" text PRIMARY KEY,
	"test_id" text NOT NULL,
	"dimension" text,
	"min_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"recommendation" text,
	"severity" "severity_level" NOT NULL,
	"version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_rules" (
	"id" text PRIMARY KEY,
	"test_id" text NOT NULL,
	"algorithm" "scoring_algorithm" NOT NULL,
	"config" jsonb NOT NULL,
	"version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"value" jsonb NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL UNIQUE,
	"test_id" text NOT NULL,
	"raw_scores" jsonb NOT NULL,
	"computed_scores" jsonb NOT NULL,
	"scoring_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_sessions" (
	"id" text PRIMARY KEY,
	"test_id" text NOT NULL,
	"guest_email" text,
	"status" "session_status" DEFAULT 'in_progress'::"session_status" NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"ip_hash" text NOT NULL,
	"user_agent_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL UNIQUE,
	"tos_accepted" boolean NOT NULL,
	"research_opt_in" boolean DEFAULT true NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"consent_version" text NOT NULL,
	"ip_hash" text NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_leads" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"session_id" text NOT NULL,
	"test_id" text NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_admin_users_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id");--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "result_interpretations" ADD CONSTRAINT "result_interpretations_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scoring_rules" ADD CONSTRAINT "scoring_rules_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_test_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id");--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_session_id_test_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id");--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_test_id_tests_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id");