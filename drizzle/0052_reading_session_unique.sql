-- Add unique constraint on (user_id, book_id, date) so ON CONFLICT upsert works correctly
-- Drop the existing plain index first, then recreate as a unique index
DROP INDEX IF EXISTS "reading_user_date_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "reading_user_book_date_idx" ON "reading_sessions" ("user_id", "book_id", "date");
