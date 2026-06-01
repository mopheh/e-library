CREATE TYPE "public"."calendar_category" AS ENUM('lecture', 'exam', 'registration', 'break', 'orientation', 'matriculation', 'revision', 'result', 'other');--> statement-breakpoint
CREATE TABLE "academic_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session" varchar(20) NOT NULL,
	"semester" varchar(20),
	"start_date" date NOT NULL,
	"end_date" date,
	"activity" text NOT NULL,
	"category" "calendar_category" DEFAULT 'other',
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_timetables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid,
	"faculty_id" uuid,
	"session" varchar(20) NOT NULL,
	"semester" "semester" NOT NULL,
	"level" "level",
	"title" varchar(255) NOT NULL,
	"file_url" text,
	"file_type" varchar(10),
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"calendar_event_id" uuid,
	"session" varchar(20) NOT NULL,
	"semester" varchar(20) NOT NULL,
	"exam_date" date NOT NULL,
	"start_time" varchar(8),
	"end_time" varchar(8),
	"venue" varchar(255),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_calendar_events" ADD CONSTRAINT "academic_calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_timetables" ADD CONSTRAINT "class_timetables_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_timetables" ADD CONSTRAINT "class_timetables_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_timetables" ADD CONSTRAINT "class_timetables_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_calendar_event_id_academic_calendar_events_id_fk" FOREIGN KEY ("calendar_event_id") REFERENCES "public"."academic_calendar_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;