CREATE INDEX "chat_messages_room_date_idx" ON "chat_messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_rooms_user_two_idx" ON "chat_rooms" USING btree ("user_two_id");--> statement-breakpoint
CREATE INDEX "comments_thread_date_idx" ON "comments" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "jobs_status_attempts_date_idx" ON "jobs" USING btree ("status","attempts","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_date_idx" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "options_question_idx" ON "options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_course_idx" ON "questions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "student_conn_aspirant_status_idx" ON "student_connections" USING btree ("aspirant_id","status");--> statement-breakpoint
CREATE INDEX "student_conn_student_status_idx" ON "student_connections" USING btree ("student_id","status");