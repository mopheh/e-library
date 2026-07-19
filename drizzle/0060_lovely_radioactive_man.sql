CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "books_title_trgm_idx" ON "books" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_description_trgm_idx" ON "books" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "community_posts_community_idx" ON "community_posts" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX "courses_title_trgm_idx" ON "courses" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "courses_code_trgm_idx" ON "courses" USING gin ("course_code" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_course_idx" ON "sessions" USING btree ("course_id");