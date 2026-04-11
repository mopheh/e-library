CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "book_pages" ADD COLUMN "embedding" vector(768);