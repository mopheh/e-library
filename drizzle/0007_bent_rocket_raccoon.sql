CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('100', '200', '300', '400', '500', '600');--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "year" TO "level";--> statement-breakpoint
ALTER TABLE "courses"
    ALTER COLUMN "level"
        SET DATA TYPE "public"."level"
    USING CASE
  WHEN level = 100 THEN '100'::"public"."level"
  WHEN level = 200 THEN '200'::"public"."level"
  WHEN level = 300 THEN '300'::"public"."level"
  WHEN level = 400 THEN '400'::"public"."level"
  WHEN level = 500 THEN '500'::"public"."level"
  WHEN level = 600 THEN '600'::"public"."level"
  ELSE NULL
END;

ALTER TABLE "reading_sessions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" varchar(255);--> statement-breakpoint
-- Step 1: Add gender as nullable
ALTER TABLE "users" ADD COLUMN "gender" "gender";

-- Step 2: Update existing rows with a default value (e.g., 'male' or 'female' or 'other')
UPDATE "users" SET "gender" = 'MALE'; -- Or any default that makes sense

-- Step 3: Alter column to NOT NULL
ALTER TABLE "users" ALTER COLUMN "gender" SET NOT NULL;
ALTER TABLE "users" ADD COLUMN "address" varchar(255);
ALTER TABLE "reading_sessions" ALTER COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;