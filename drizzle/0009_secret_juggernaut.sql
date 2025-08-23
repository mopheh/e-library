CREATE TABLE "book_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"text_chunk" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_pages_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "book_pages" ADD CONSTRAINT "book_pages_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;