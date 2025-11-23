-- Migration: 0061_ensure_document_review_type.sql
-- Description: Ensure 'document' review type exists and is properly supported
-- Date: 2025-11-23
-- Version: v8.4.5

-- The reviews table already supports different review_types through the 0001_add_review_type.sql migration
-- This migration ensures that 'document' is a valid review_type value

-- Check current review_type values in reviews table
-- Valid values are: 'quarterly', 'yearly', 'custom', 'famous-book', 'document'

-- Add index for faster document review queries
CREATE INDEX IF NOT EXISTS idx_reviews_type_user_documents 
ON reviews(review_type, user_id, updated_at DESC) 
WHERE review_type = 'document';

-- Add index for famous books as well (if not exists)
CREATE INDEX IF NOT EXISTS idx_reviews_type_user_famous_books 
ON reviews(review_type, user_id, updated_at DESC) 
WHERE review_type = 'famous-book';

SELECT '✅ Document review type indexes created successfully' as message;
