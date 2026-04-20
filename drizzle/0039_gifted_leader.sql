DO $$ BEGIN CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'FULFILLED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"course_code" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"fulfilled_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_user_date_idx" ON "activities" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "threads_course_idx" ON "threads" USING btree ("course_id","created_at");