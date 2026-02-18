CREATE TYPE "public"."job_type" AS ENUM('parse_book', 'generate_questions');--> statement-breakpoint
ALTER TABLE "book_pages" ALTER COLUMN "text_chunk" SET DATA TYPE text;