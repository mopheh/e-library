-- Custom SQL migration file, put your code below! --

-- schema.ts has declared onDelete: "cascade" on these two FKs for a while,
-- but no migration ever actually applied it - migration 0015 created both
-- as "ON DELETE no action" and nothing since altered them, so every
-- attempt to delete a question 500'd with a foreign key violation (options/
-- answers still referencing it). This brings the live constraints in line
-- with what schema.ts (and drizzle-kit's own snapshot) already claims.
ALTER TABLE "options" DROP CONSTRAINT "options_question_id_questions_id_fk";--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "answers" DROP CONSTRAINT "answers_question_id_questions_id_fk";--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;