-- Add system settings table for configurable parameters
-- Migration: 0045_create_system_settings.sql

CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'string',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Insert default AI writing settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('ai_max_output_tokens', '8192', 'number', 'ai_writing', 'Gemini API 最大输出 Token 数量（1000-8192）'),
  ('ai_temperature', '0.7', 'number', 'ai_writing', 'AI 生成内容的创意度（0-1，推荐 0.7）'),
  ('ai_default_word_count', '1000', 'number', 'ai_writing', '默认目标字数'),
  ('ai_enabled', 'true', 'boolean', 'ai_writing', '是否启用 AI 写作功能');

-- Insert other system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('system_name', 'Review System', 'string', 'general', '系统名称'),
  ('system_version', '7.0.0', 'string', 'general', '系统版本');
