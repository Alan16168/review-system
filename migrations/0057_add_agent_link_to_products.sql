-- Migration: Add agent_link field to marketplace_products table
-- This field stores the URL/link to activate the agent

-- Add agent_link column to marketplace_products
ALTER TABLE marketplace_products ADD COLUMN agent_link TEXT;

-- Add comment for documentation
-- agent_link: URL or path to activate/use the agent product
-- Examples:
--   - '/ai-writing' for AI writing agent
--   - '/file-processor' for file processing agent
--   - 'https://external-service.com/agent/123' for external agents

-- Update existing products with their agent links
-- Product ID 1: AI智能写作助手
UPDATE marketplace_products 
SET agent_link = '/ai-writing'
WHERE id = 1;

-- Product ID 10: 新智能文件处理助手
UPDATE marketplace_products 
SET agent_link = '/file-processor'
WHERE id = 10;

-- Product ID 12: 新新智能体
UPDATE marketplace_products 
SET agent_link = '/new-agent'
WHERE id = 12;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_products_agent_link 
ON marketplace_products(agent_link);
