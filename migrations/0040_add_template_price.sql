-- Migration: Add price field to templates table
-- Version: V6.12.0
-- Date: 2025-11-18

-- Add price column to templates table (default 0 USD)
ALTER TABLE templates ADD COLUMN price REAL DEFAULT 0.0;

-- Add comment for clarity (SQLite doesn't support column comments, but we document here)
-- price: Template price in USD, default 0.0 (free template)
