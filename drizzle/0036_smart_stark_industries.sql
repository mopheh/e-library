CREATE TYPE "public"."opportunity_type" AS ENUM('INTERNSHIP', 'SCHOLARSHIP', 'HACKATHON', 'JOB');--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"type" "opportunity_type" DEFAULT 'INTERNSHIP' NOT NULL,
	"deadline" timestamp with time zone,
	"department_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_profiles" DROP CONSTRAINT "candidate_profiles_intended_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "intended_department_id" uuid;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "jamb_no" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "approved_department_id" uuid;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "approved_faculty_id" uuid;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "admission_year" varchar(10);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "level" "level";--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_intended_department_id_department_id_fk" FOREIGN KEY ("intended_department_id") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_approved_department_id_department_id_fk" FOREIGN KEY ("approved_department_id") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_approved_faculty_id_faculty_id_fk" FOREIGN KEY ("approved_faculty_id") REFERENCES "public"."faculty"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" DROP COLUMN "intended_course_id";