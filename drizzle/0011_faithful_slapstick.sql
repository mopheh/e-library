CREATE TYPE "public"."parse_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "parse_status" "parse_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "page_count" integer;--> statement-breakpoint
ALTER TABLE "book_pages" ADD CONSTRAINT "book_pages_book_id_page_number_unique" UNIQUE("book_id","page_number");