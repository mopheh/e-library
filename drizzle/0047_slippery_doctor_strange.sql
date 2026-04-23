ALTER TABLE "department_courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "department_courses" CASCADE;--> statement-breakpoint
ALTER TABLE "department" RENAME TO "departments";--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT "department_id_unique" CASCADE;--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT "department_name_unique" CASCADE;--> statement-breakpoint
ALTER TABLE "reading_sessions" DROP CONSTRAINT "reading_sessions_id_unique" CASCADE;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "books" DROP CONSTRAINT "books_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_profiles" DROP CONSTRAINT "candidate_profiles_intended_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "department_communities" DROP CONSTRAINT "department_communities_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT "department_faculty_id_faculty_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_requests" DROP CONSTRAINT "resource_requests_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "senior_qa" DROP CONSTRAINT "senior_qa_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "verification_requests" DROP CONSTRAINT "verification_requests_approved_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "resource_requests" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_intended_department_id_departments_id_fk" FOREIGN KEY ("intended_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_communities" ADD CONSTRAINT "department_communities_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "senior_qa" ADD CONSTRAINT "senior_qa_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_approved_department_id_departments_id_fk" FOREIGN KEY ("approved_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_requests" DROP COLUMN "course_code";--> statement-breakpoint
-- Constraints added earlier