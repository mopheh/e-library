ALTER TYPE "public"."notification_type" ADD VALUE 'CONNECTION_REQUEST';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text;