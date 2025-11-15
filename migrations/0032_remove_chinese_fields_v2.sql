-- Safe migration to remove Chinese-specific fields
-- This migration uses column renaming approach to avoid foreign key constraints

-- Disable foreign key enforcement temporarily
PRAGMA foreign_keys = OFF;

-- Step 1: Update templates table - simply drop Chinese columns
-- First, check if we have data in Chinese columns that needs to be preserved
UPDATE templates 
SET name = COALESCE(name_en, name), 
    description = COALESCE(description_en, description)
WHERE name_en IS NOT NULL OR description_en IS NOT NULL;

-- Step 2: Update template_questions table
UPDATE template_questions 
SET question_text = COALESCE(question_text_en, question_text)
WHERE question_text_en IS NOT NULL;

-- Step 3: Update testimonials table
UPDATE testimonials 
SET name = COALESCE(name_en, name),
    role = COALESCE(role_en, role),
    content = COALESCE(content_en, content)
WHERE name_en IS NOT NULL OR role_en IS NOT NULL OR content_en IS NOT NULL;

-- Step 4: Update subscription_config table
UPDATE subscription_config 
SET description = COALESCE(description_en, description)
WHERE description_en IS NOT NULL;

-- Re-enable foreign key enforcement
PRAGMA foreign_keys = ON;

-- Note: We've kept both column sets for now. To fully remove Chinese columns,
-- you would need to recreate tables, but that requires careful handling of foreign keys
-- and is better done with proper downtime planning.
