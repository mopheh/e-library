CREATE INDEX "reading_user_date_idx" ON "reading_sessions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "user_books_user_idx" ON "user_books" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_books_book_idx" ON "user_books" USING btree ("book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_books_user_book_idx" ON "user_books" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_matric_idx" ON "users" USING btree ("matric_no");--> statement-breakpoint
CREATE INDEX "users_faculty_idx" ON "users" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "users_department_idx" ON "users" USING btree ("department_id");