CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "book_pages" ADD COLUMN "needs_review" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "needs_review" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "book_courses_book_idx" ON "book_courses" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_courses_course_idx" ON "book_courses" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_courses_book_course_idx" ON "book_courses" USING btree ("book_id","course_id");--> statement-breakpoint
CREATE INDEX "books_department_idx" ON "books" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "courses_department_idx" ON "courses" USING btree ("department_id");