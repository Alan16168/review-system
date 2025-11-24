-- Add team and contact information settings
-- These settings allow customization of team description and contact information

-- Team description
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('ui_team_description', '本软件由 GoGlobal AI 团队制作', 'text', 'ui', 'Team description text displayed on homepage');

-- Contact email
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('ui_contact_email', 'ireviewsystem@hotmail.com', 'text', 'ui', 'Contact email address displayed on homepage');
