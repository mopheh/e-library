CREATE TYPE "public"."letter_grade" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');--> statement-breakpoint
CREATE TABLE "academic_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"prior_cgpa" numeric(3, 2),
	"prior_units" integer,
	"target_cgpa" numeric(3, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"course_id" uuid,
	"course_code" varchar(20) NOT NULL,
	"course_title" varchar(255),
	"units" integer NOT NULL,
	"grade" "letter_grade" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semester_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session" varchar(9) NOT NULL,
	"semester" "semester" NOT NULL,
	"level" "level" NOT NULL,
	"slip_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_profiles" ADD CONSTRAINT "academic_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_result_id_semester_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."semester_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_results" ADD CONSTRAINT "semester_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_grades_result_code_idx" ON "course_grades" USING btree ("result_id","course_code");--> statement-breakpoint
CREATE UNIQUE INDEX "semester_results_user_term_idx" ON "semester_results" USING btree ("user_id","session","semester");