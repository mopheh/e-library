DROP TABLE "course_ai_messages" CASCADE;--> statement-breakpoint
DROP TABLE "course_ai_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "exam_date" timestamp with time zone;