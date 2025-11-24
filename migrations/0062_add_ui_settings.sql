-- Migration: Add UI Settings (Interface Customization)
-- Date: 2025-11-24
-- Description: Add system settings for customizable UI text content

-- Insert UI settings for homepage customization
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- System title (shown in header and browser tab)
('ui_system_title', '系统复盘平台', 'text', 'ui', 'System title displayed in header and browser tab'),

-- Homepage hero title
('ui_homepage_hero_title', '打造学习型组织，从系统复盘开始', 'text', 'ui', 'Main title on homepage hero section'),

-- Homepage hero subtitle
('ui_homepage_hero_subtitle', '帮助个人和团队通过结构化复盘，沉淀经验、发现规律、持续成长', 'text', 'ui', 'Subtitle text on homepage hero section'),

-- About us section content
('ui_about_us_content', '我们致力于帮助个人和团队建立系统化的复盘习惯，通过结构化的反思框架，让每一次经验都成为成长的阶梯。我们相信，真正的学习不在于经历了什么，而在于从经历中提炼出了什么。让复盘成为一种习惯，让成长成为一种必然。', 'text', 'ui', 'About us section main content'),

-- Footer company info
('ui_footer_company_info', '系统复盘平台 © 2025', 'text', 'ui', 'Footer copyright and company information');

-- Verify settings were inserted
SELECT 'UI Settings Migration Completed' as status, COUNT(*) as settings_count 
FROM system_settings 
WHERE category = 'ui';
