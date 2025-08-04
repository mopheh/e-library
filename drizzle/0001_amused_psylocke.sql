CREATE TYPE "public"."semester" AS ENUM('FIRST', 'SECOND');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"department_id" uuid NOT NULL,
	"file_url" varchar(1000)
);
--> statement-breakpoint
CREATE TABLE "department_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"course_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "semester" "semester" DEFAULT 'FIRST';--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_courses" ADD CONSTRAINT "department_courses_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_courses" ADD CONSTRAINT "department_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;