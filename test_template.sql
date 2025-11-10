INSERT INTO templates (name, description, is_active, created_by) 
VALUES ('测试模板-选择题', '包含单选和多选题的测试模板', 1, 1);

INSERT INTO template_questions (template_id, question_number, question_text, question_type, options)
SELECT 
  (SELECT id FROM templates WHERE name = '测试模板-选择题'),
  1, '这是一个单选题', 'single_choice', 'A.选项A|B.选项B|C.选项C'
UNION ALL
SELECT 
  (SELECT id FROM templates WHERE name = '测试模板-选择题'),
  2, '这是一个多选题', 'multiple_choice', 'A.选项A|B.选项B|C.选项C|D.选项D';

SELECT id, name FROM templates WHERE name = '测试模板-选择题';
