-- Add terms of service and privacy policy settings
-- These settings allow customization of legal documents

-- Terms of Service (500 characters max)
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('ui_terms_of_service', '欢迎使用系统复盘平台。使用本服务即表示您同意遵守以下条款。我们提供个人和团队复盘工具,帮助用户进行系统化的经验总结和反思。用户需对其账户信息负责,不得用于非法用途。我们保留随时修改服务条款的权利。如有问题,请通过邮件联系我们。', 'text', 'ui', 'Terms of service text (max 500 characters)');

-- Privacy Policy (800 characters max)
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('ui_privacy_policy', '我们重视您的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息。我们收集的信息包括:注册时提供的邮箱、姓名等基本信息;使用服务时产生的复盘记录、模板等内容数据。我们使用这些信息来提供和改进服务,不会将您的个人信息出售给第三方。我们采用行业标准的安全措施保护您的数据,包括加密传输和安全存储。您有权随时访问、修改或删除您的个人信息。我们可能使用Cookie来改善用户体验。如果您对我们的隐私政策有任何疑问,请通过邮件联系我们。使用本服务即表示您同意本隐私政策。', 'text', 'ui', 'Privacy policy text (max 800 characters)');
