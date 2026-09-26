CREATE TYPE "public"."study_method" AS ENUM('TEXTBOOK', 'NOTES', 'PAST_QUESTIONS', 'GROUP', 'OTHER');--> statement-breakpoint
CREATE TABLE "study_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"date" date NOT NULL,
	"times_read" integer DEFAULT 1 NOT NULL,
	"minutes" integer,
	"method" "study_method" DEFAULT 'TEXTBOOK' NOT NULL,
	"note" varchar(280),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_logs" ADD CONSTRAINT "study_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_logs" ADD CONSTRAINT "study_logs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_logs_user_date_idx" ON "study_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "study_logs_user_course_idx" ON "study_logs" USING btree ("user_id","course_id");