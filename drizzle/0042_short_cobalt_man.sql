ALTER TABLE "candidate_profiles" ADD COLUMN "subject_combinations" jsonb;--> statement-breakpoint
ALTER TABLE "user_books" ADD COLUMN "progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_books" ADD COLUMN "last_page" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "subject_combinations" jsonb;