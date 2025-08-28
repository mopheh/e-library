ALTER TABLE "answers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "session_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "question_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "selected_option_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "options" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "course_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_id_unique" UNIQUE("id");