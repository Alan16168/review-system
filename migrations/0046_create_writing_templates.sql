-- Migration: 0046_create_writing_templates.sql
-- Description: Create Writing Templates system for AI Books (similar to Review templates)
-- Date: 2025-11-20
-- Version: 7.1.0

-- ============================================================================
-- Writing Templates - Main template structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_writing_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Owner info (similar to review templates)
  owner_id INTEGER,
  owner_type TEXT NOT NULL DEFAULT 'system' CHECK(owner_type IN ('system', 'team', 'individual')),
  team_id INTEGER,
  
  -- Template info
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  
  -- Template category (类似复盘模板的分类)
  category TEXT NOT NULL DEFAULT 'general' CHECK(category IN (
    'general',          -- 通用
    'business',         -- 商业
    'technical',        -- 技术
    'academic',         -- 学术
    'fiction',          -- 小说
    'biography',        -- 传记
    'education',        -- 教育
    'marketing',        -- 营销
    'self_help',        -- 自我提升
    'custom'            -- 自定义
  )),
  
  -- Template configuration
  icon TEXT DEFAULT 'book',
  color TEXT DEFAULT 'blue',
  tags TEXT, -- Comma-separated tags
  
  -- Default settings for books created from this template
  default_tone TEXT DEFAULT 'professional',
  default_audience TEXT DEFAULT 'general',
  default_language TEXT DEFAULT 'zh',
  default_target_words INTEGER DEFAULT 50000,
  
  -- AI Prompts (预设的AI生成提示词)
  chapter_generation_prompt TEXT,
  section_generation_prompt TEXT,
  content_generation_prompt TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  is_public BOOLEAN DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_writing_templates_owner ON ai_writing_templates(owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_writing_templates_team ON ai_writing_templates(team_id);
CREATE INDEX IF NOT EXISTS idx_writing_templates_category ON ai_writing_templates(category);
CREATE INDEX IF NOT EXISTS idx_writing_templates_active ON ai_writing_templates(is_active, is_public);

-- ============================================================================
-- Writing Template Fields - Configurable fields (类似复盘的 review_fields)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_writing_template_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  
  -- Field configuration
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK(field_type IN (
    'text',           -- 单行文本
    'textarea',       -- 多行文本
    'number',         -- 数字
    'select',         -- 下拉选择
    'radio',          -- 单选
    'checkbox',       -- 复选框
    'date',           -- 日期
    'time',           -- 时间
    'url',            -- URL
    'email',          -- 邮箱
    'markdown'        -- Markdown编辑器
  )),
  
  -- Field labels
  label TEXT NOT NULL,
  label_en TEXT,
  
  -- Field properties
  placeholder TEXT,
  default_value TEXT,
  options_json TEXT, -- JSON array for select/radio/checkbox options
  
  -- Validation
  is_required BOOLEAN DEFAULT 0,
  min_length INTEGER,
  max_length INTEGER,
  validation_regex TEXT,
  
  -- Display
  help_text TEXT,
  help_text_en TEXT,
  sort_order INTEGER DEFAULT 0,
  group_name TEXT, -- Field grouping
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (template_id) REFERENCES ai_writing_templates(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_writing_template_fields_template ON ai_writing_template_fields(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_writing_template_fields_active ON ai_writing_template_fields(is_active);

-- ============================================================================
-- Link templates to books
-- ============================================================================

-- Add template_id to ai_books table
ALTER TABLE ai_books ADD COLUMN template_id INTEGER REFERENCES ai_writing_templates(id) ON DELETE SET NULL;

-- Add metadata field to store template field values
ALTER TABLE ai_books ADD COLUMN template_metadata TEXT; -- JSON string of field values

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_books_template ON ai_books(template_id);

-- ============================================================================
-- Insert default system templates
-- ============================================================================

-- 1. General Template (通用模板)
INSERT INTO ai_writing_templates (
  name, name_en, description, description_en,
  category, owner_type, is_active, is_public, is_featured,
  default_tone, default_audience, default_target_words
) VALUES (
  '通用书籍模板',
  'General Book Template',
  '适用于各类书籍的通用模板，包含基本书籍信息字段',
  'Universal template for all types of books with basic information fields',
  'general',
  'system',
  1,
  1,
  1,
  'professional',
  'general',
  50000
);

-- 2. Business Template (商业书籍模板)
INSERT INTO ai_writing_templates (
  name, name_en, description, description_en,
  category, owner_type, is_active, is_public, is_featured,
  default_tone, default_audience, default_target_words,
  icon, color
) VALUES (
  '商业书籍模板',
  'Business Book Template',
  '适合创业、管理、商业类书籍，包含行业分析、案例研究等字段',
  'For entrepreneurship, management, and business books with industry analysis and case studies',
  'business',
  'system',
  1,
  1,
  1,
  'professional',
  'business_professionals',
  60000,
  'briefcase',
  'blue'
);

-- 3. Technical Template (技术书籍模板)
INSERT INTO ai_writing_templates (
  name, name_en, description, description_en,
  category, owner_type, is_active, is_public, is_featured,
  default_tone, default_audience, default_target_words,
  icon, color
) VALUES (
  '技术书籍模板',
  'Technical Book Template',
  '适合编程、技术教程类书籍，包含技术栈、代码示例等字段',
  'For programming and technical tutorials with tech stack and code examples',
  'technical',
  'system',
  1,
  1,
  1,
  'technical',
  'developers',
  70000,
  'code',
  'green'
);

-- 4. Fiction Template (小说模板)
INSERT INTO ai_writing_templates (
  name, name_en, description, description_en,
  category, owner_type, is_active, is_public,
  default_tone, default_audience, default_target_words,
  icon, color
) VALUES (
  '小说创作模板',
  'Fiction Writing Template',
  '适合小说、故事创作，包含人物设定、情节发展等字段',
  'For fiction and storytelling with character development and plot structure',
  'fiction',
  'system',
  1,
  1,
  'narrative',
  'general_readers',
  80000,
  'feather',
  'purple'
);

-- ============================================================================
-- Insert default fields for General Template (template_id = 1)
-- ============================================================================

INSERT INTO ai_writing_template_fields (
  template_id, field_key, field_type, label, label_en, 
  placeholder, is_required, sort_order, group_name
) VALUES
  (1, 'genre', 'select', '书籍类型', 'Book Genre', '选择书籍类型', 0, 10, 'basic_info'),
  (1, 'target_audience', 'textarea', '目标读者', 'Target Audience', '描述主要目标读者群体', 0, 20, 'basic_info'),
  (1, 'key_themes', 'textarea', '核心主题', 'Key Themes', '列出本书的核心主题和要点', 0, 30, 'content'),
  (1, 'unique_value', 'textarea', '独特价值', 'Unique Value Proposition', '本书的独特价值和卖点', 0, 40, 'content'),
  (1, 'references', 'textarea', '参考资料', 'References', '参考的书籍、资料来源', 0, 50, 'metadata');

-- Add options for genre field
UPDATE ai_writing_template_fields 
SET options_json = '["non_fiction", "fiction", "business", "technical", "academic", "self_help", "biography", "education", "other"]'
WHERE template_id = 1 AND field_key = 'genre';

-- ============================================================================
-- Insert default fields for Business Template (template_id = 2)
-- ============================================================================

INSERT INTO ai_writing_template_fields (
  template_id, field_key, field_type, label, label_en,
  placeholder, is_required, sort_order, group_name
) VALUES
  (2, 'industry', 'select', '行业领域', 'Industry', '选择目标行业', 1, 10, 'business_info'),
  (2, 'problem_statement', 'textarea', '问题陈述', 'Problem Statement', '描述要解决的商业问题', 1, 20, 'business_info'),
  (2, 'solution_approach', 'textarea', '解决方案', 'Solution Approach', '提出的解决方案和方法', 1, 30, 'business_info'),
  (2, 'case_studies', 'textarea', '案例研究', 'Case Studies', '相关案例和实例', 0, 40, 'content'),
  (2, 'tools_frameworks', 'textarea', '工具和框架', 'Tools & Frameworks', '使用的工具、模型和框架', 0, 50, 'content'),
  (2, 'implementation_guide', 'textarea', '实施指南', 'Implementation Guide', '如何应用和实施', 0, 60, 'content');

-- Add options for industry field
UPDATE ai_writing_template_fields
SET options_json = '["technology", "finance", "healthcare", "education", "retail", "manufacturing", "services", "consulting", "other"]'
WHERE template_id = 2 AND field_key = 'industry';

-- ============================================================================
-- Insert default fields for Technical Template (template_id = 3)
-- ============================================================================

INSERT INTO ai_writing_template_fields (
  template_id, field_key, field_type, label, label_en,
  placeholder, is_required, sort_order, group_name
) VALUES
  (3, 'tech_stack', 'textarea', '技术栈', 'Tech Stack', '使用的编程语言、框架、工具', 1, 10, 'technical_info'),
  (3, 'prerequisites', 'textarea', '前置知识', 'Prerequisites', '读者需要具备的基础知识', 1, 20, 'technical_info'),
  (3, 'learning_objectives', 'textarea', '学习目标', 'Learning Objectives', '读者将学到什么', 1, 30, 'technical_info'),
  (3, 'code_examples', 'checkbox', '包含代码示例', 'Include Code Examples', '', 0, 40, 'content'),
  (3, 'practice_projects', 'textarea', '实践项目', 'Practice Projects', '实践练习和项目', 0, 50, 'content'),
  (3, 'difficulty_level', 'select', '难度级别', 'Difficulty Level', '', 1, 60, 'metadata');

-- Add options
UPDATE ai_writing_template_fields
SET options_json = '["beginner", "intermediate", "advanced", "expert"]'
WHERE template_id = 3 AND field_key = 'difficulty_level';

-- ============================================================================
-- Insert default fields for Fiction Template (template_id = 4)
-- ============================================================================

INSERT INTO ai_writing_template_fields (
  template_id, field_key, field_type, label, label_en,
  placeholder, is_required, sort_order, group_name
) VALUES
  (4, 'story_genre', 'select', '小说类型', 'Story Genre', '', 1, 10, 'story_info'),
  (4, 'setting', 'textarea', '故事背景', 'Setting', '时间、地点、环境设定', 1, 20, 'story_info'),
  (4, 'main_characters', 'textarea', '主要人物', 'Main Characters', '主角和重要配角的设定', 1, 30, 'characters'),
  (4, 'character_development', 'textarea', '人物发展', 'Character Development', '人物成长和变化', 0, 40, 'characters'),
  (4, 'plot_structure', 'textarea', '情节结构', 'Plot Structure', '故事主线和结构', 1, 50, 'plot'),
  (4, 'conflict', 'textarea', '核心冲突', 'Central Conflict', '故事的主要矛盾和冲突', 1, 60, 'plot'),
  (4, 'themes', 'textarea', '主题思想', 'Themes', '故事想要表达的主题', 0, 70, 'plot'),
  (4, 'writing_style', 'select', '写作风格', 'Writing Style', '', 0, 80, 'style');

-- Add options
UPDATE ai_writing_template_fields
SET options_json = '["romance", "mystery", "thriller", "sci_fi", "fantasy", "historical", "contemporary", "adventure", "horror", "other"]'
WHERE template_id = 4 AND field_key = 'story_genre';

UPDATE ai_writing_template_fields
SET options_json = '["first_person", "third_person_limited", "third_person_omniscient", "multiple_povs"]'
WHERE template_id = 4 AND field_key = 'writing_style';

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Writing Templates system created successfully' as message;
SELECT 'Templates: General, Business, Technical, Fiction' as info;
SELECT 'Total template fields: 24' as fields_info;
