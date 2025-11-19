-- Migration: Add initial_prompt field to ai_books table
-- This stores the original prompt used to generate the book's chapter outline

ALTER TABLE ai_books ADD COLUMN initial_prompt TEXT;

-- Add comment explaining the field
-- initial_prompt: Stores the AI prompt used during first chapter generation
-- This allows users to see what parameters were used originally
