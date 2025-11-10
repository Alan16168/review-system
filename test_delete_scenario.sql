-- Create a test template
INSERT INTO templates (name, description, is_active, created_by, is_default) 
VALUES ('测试删除模板', '用于测试删除功能的模板', 1, 1, 0);

-- Get the template ID (assuming it's the max ID)
INSERT INTO template_questions (template_id, question_number, question_text, question_type)
SELECT 
  (SELECT MAX(id) FROM templates),
  1, '测试问题1', 'text';

-- Create a review using this template
INSERT INTO reviews (title, user_id, template_id, date, status)
VALUES ('使用测试模板的复盘', 1, (SELECT MAX(id) FROM templates), date('now'), 'draft');

-- Show results
SELECT 'Templates:' as info;
SELECT id, name, is_active FROM templates ORDER BY is_active DESC, id;

SELECT 'Reviews:' as info;
SELECT id, title, template_id FROM reviews ORDER BY id DESC LIMIT 3;
