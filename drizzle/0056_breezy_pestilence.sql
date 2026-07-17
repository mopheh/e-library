CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "review_status" "review_status" DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_review_status_idx" ON "books" USING btree ("review_status");