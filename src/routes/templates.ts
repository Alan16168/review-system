import { Hono } from 'hono';
import { authMiddleware, UserPayload, adminOnly, premiumOrAdmin } from '../middleware/auth';

const templates = new Hono();

// Apply auth middleware to all template routes
templates.use('/*', authMiddleware);

// Helper function to get language from request
function getLanguage(c: any): string {
  // Try X-Language header first
  const xLanguage = c.req.header('X-Language');
  if (xLanguage && (xLanguage === 'en' || xLanguage === 'zh')) {
    return xLanguage;
  }
  
  // Try Accept-Language header
  const acceptLanguage = c.req.header('Accept-Language') || '';
  if (acceptLanguage.includes('zh')) {
    return 'zh';
  }
  
  // Default to English
  return 'en';
}

// Get all active templates with their questions
templates.get('/', async (c) => {
  try {
    const lang = getLanguage(c);
    
    // Get all active templates with language-specific fields
    const templatesResult = await c.env.DB.prepare(`
      SELECT 
        id, 
        CASE WHEN ? = 'en' AND name_en IS NOT NULL THEN name_en ELSE name END as name,
        CASE WHEN ? = 'en' AND description_en IS NOT NULL THEN description_en ELSE description END as description,
        is_default, 
        created_at
      FROM templates
      WHERE is_active = 1
      ORDER BY is_default DESC, created_at DESC
    `).bind(lang, lang).all();

    const templateList = templatesResult.results || [];

    // Get questions for each template with language-specific text
    const templatesWithQuestions = await Promise.all(
      templateList.map(async (template: any) => {
        const questionsResult = await c.env.DB.prepare(`
          SELECT 
            question_number,
            CASE WHEN ? = 'en' AND question_text_en IS NOT NULL THEN question_text_en ELSE question_text END as question_text,
            answer_length,
            question_type,
            options,
            correct_answer
          FROM template_questions
          WHERE template_id = ?
          ORDER BY question_number ASC
        `).bind(lang, template.id).all();

        return {
          ...template,
          questions: questionsResult.results || []
        };
      })
    );

    return c.json({ templates: templatesWithQuestions });
  } catch (error) {
    console.error('Get templates error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get a specific template with its questions
templates.get('/:id', async (c) => {
  try {
    const templateId = c.req.param('id');
    const lang = getLanguage(c);

    // Get template with language-specific fields
    const template = await c.env.DB.prepare(`
      SELECT 
        id, 
        CASE WHEN ? = 'en' AND name_en IS NOT NULL THEN name_en ELSE name END as name,
        CASE WHEN ? = 'en' AND description_en IS NOT NULL THEN description_en ELSE description END as description,
        is_default, 
        created_at
      FROM templates
      WHERE id = ? AND is_active = 1
    `).bind(lang, lang, templateId).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Get questions with language-specific text
    const questionsResult = await c.env.DB.prepare(`
      SELECT 
        question_number,
        CASE WHEN ? = 'en' AND question_text_en IS NOT NULL THEN question_text_en ELSE question_text END as question_text,
        answer_length,
        question_type,
        options,
        correct_answer
      FROM template_questions
      WHERE template_id = ?
      ORDER BY question_number ASC
    `).bind(lang, templateId).all();

    return c.json({
      template: {
        ...template,
        questions: questionsResult.results || []
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Get all templates (including inactive ones)
templates.get('/admin/all', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Get templates based on user role
    // Premium users: only their own templates
    // Admins: all templates
    let query = `
      SELECT 
        t.id, 
        t.name,
        t.name_en,
        t.description,
        t.description_en,
        t.is_default,
        t.is_active,
        t.created_at,
        t.updated_at,
        t.created_by,
        u.username as creator_name,
        u.role as creator_role
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
    `;
    
    if (user.role === 'premium') {
      query += ` WHERE t.created_by = ?`;
    }
    
    query += ` ORDER BY t.is_default DESC, t.created_at DESC`;
    
    const statement = c.env.DB.prepare(query);
    const templatesResult = user.role === 'premium' 
      ? await statement.bind(user.id).all()
      : await statement.all();

    const templateList = templatesResult.results || [];

    // Get question count for each template
    const templatesWithCounts = await Promise.all(
      templateList.map(async (template: any) => {
        const countResult = await c.env.DB.prepare(`
          SELECT COUNT(*) as question_count
          FROM template_questions
          WHERE template_id = ?
        `).bind(template.id).first();

        return {
          ...template,
          question_count: countResult?.question_count || 0
        };
      })
    );

    return c.json({ templates: templatesWithCounts });
  } catch (error) {
    console.error('Get all templates error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Get template with all details (for editing)
templates.get('/admin/:id', premiumOrAdmin, async (c) => {
  try {
    const templateId = c.req.param('id');

    // Get template with all fields
    const template = await c.env.DB.prepare(`
      SELECT 
        id, 
        name,
        name_en,
        description,
        description_en,
        is_default,
        is_active,
        created_at,
        updated_at
      FROM templates
      WHERE id = ?
    `).bind(templateId).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Get all questions with both languages
    const questionsResult = await c.env.DB.prepare(`
      SELECT 
        id,
        question_number,
        question_text,
        question_text_en,
        answer_length,
        question_type,
        options,
        correct_answer
      FROM template_questions
      WHERE template_id = ?
      ORDER BY question_number ASC
    `).bind(templateId).all();

    return c.json({
      template: {
        ...template,
        questions: questionsResult.results || []
      }
    });
  } catch (error) {
    console.error('Get template for admin error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Create a new template
templates.post('/', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Check if user is properly authenticated
    if (!user || !user.id) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    
    const { name, name_en, description, description_en, is_default } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Template name is required' }, 400);
    }

    // Only admin users can set templates as default
    const canSetDefault = user.role === 'admin';
    const actualIsDefault = is_default && canSetDefault;

    // If this is set as default, unset other defaults
    if (actualIsDefault) {
      await c.env.DB.prepare(`
        UPDATE templates SET is_default = 0
      `).run();
    }

    // Insert new template with creator
    const result = await c.env.DB.prepare(`
      INSERT INTO templates (name, name_en, description, description_en, is_default, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(
      name,
      name_en || null,
      description || null,
      description_en || null,
      actualIsDefault ? 1 : 0,
      user.id
    ).run();

    return c.json({ 
      message: 'Template created successfully',
      id: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('Create template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Update a template
templates.put('/:id', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');
    const { name, name_en, description, description_en, is_default, is_active } = await c.req.json();

    // Check if template exists and get creator
    const existing = await c.env.DB.prepare(`
      SELECT id, created_by, is_default as current_is_default FROM templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Permission check: Premium users can only edit their own templates
    if (user.role === 'premium' && existing.created_by !== user.id) {
      return c.json({ error: 'You can only edit your own templates' }, 403);
    }

    // Only admin can set/unset default flag
    // For non-admin users, keep the existing is_default value
    const canSetDefault = user.role === 'admin';
    const actualIsDefault = canSetDefault ? is_default : existing.current_is_default;

    // If this is set as default, unset other defaults
    if (actualIsDefault && !existing.current_is_default) {
      await c.env.DB.prepare(`
        UPDATE templates SET is_default = 0 WHERE id != ?
      `).bind(templateId).run();
    }

    // Update template
    await c.env.DB.prepare(`
      UPDATE templates
      SET name = ?,
          name_en = ?,
          description = ?,
          description_en = ?,
          is_default = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      name_en || null,
      description || null,
      description_en || null,
      actualIsDefault ? 1 : 0,
      is_active ? 1 : 0,
      templateId
    ).run();

    return c.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Delete a template (soft delete)
templates.delete('/:id', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');

    // Check if template exists and get creator
    const template = await c.env.DB.prepare(`
      SELECT id, is_default, created_by FROM templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Permission check: Premium users can only delete their own templates
    if (user.role === 'premium' && template.created_by !== user.id) {
      return c.json({ error: 'You can only delete your own templates' }, 403);
    }

    // Cannot delete default template
    if (template.is_default) {
      return c.json({ error: 'Cannot delete the default template' }, 400);
    }

    // Check if template is being used by any reviews
    const usageCheck = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM reviews WHERE template_id = ?
    `).bind(templateId).first<any>();

    // If template is being used, reassign those reviews to default template (id=1)
    if (usageCheck && usageCheck.count > 0) {
      await c.env.DB.prepare(`
        UPDATE reviews SET template_id = 1 WHERE template_id = ?
      `).bind(templateId).run();
    }

    // Hard delete - remove template and its questions
    await c.env.DB.prepare(`
      DELETE FROM template_questions WHERE template_id = ?
    `).bind(templateId).run();
    
    await c.env.DB.prepare(`
      DELETE FROM templates WHERE id = ?
    `).bind(templateId).run();
    
    return c.json({ 
      message: usageCheck && usageCheck.count > 0 
        ? `Template deleted successfully. ${usageCheck.count} review(s) were reassigned to the default template.`
        : 'Template deleted successfully',
      affected_reviews: usageCheck ? usageCheck.count : 0
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Add a question to a template
templates.post('/:id/questions', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');
    const { 
      question_text, 
      question_text_en, 
      question_number, 
      answer_length,
      question_type = 'text',
      options = null,
      correct_answer = null
    } = await c.req.json();

    if (!question_text) {
      return c.json({ error: 'Question text is required' }, 400);
    }

    // Validate question type
    if (!['text', 'single_choice', 'multiple_choice'].includes(question_type)) {
      return c.json({ error: 'Invalid question type' }, 400);
    }

    // Validate choice questions
    if (question_type === 'single_choice' || question_type === 'multiple_choice') {
      if (!options) {
        return c.json({ error: 'Options are required for choice questions' }, 400);
      }
      
      // Validate options format
      try {
        const parsedOptions = JSON.parse(options);
        if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
          return c.json({ error: 'Options must be a non-empty array' }, 400);
        }
      } catch (e) {
        return c.json({ error: 'Invalid options format' }, 400);
      }
      
      if (!correct_answer) {
        return c.json({ error: 'Correct answer is required for choice questions' }, 400);
      }
    }

    // Check if template exists and get creator
    const template = await c.env.DB.prepare(`
      SELECT id, created_by FROM templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Permission check: Premium users can only edit their own templates
    if (user.role === 'premium' && template.created_by !== user.id) {
      return c.json({ error: 'You can only edit your own templates' }, 403);
    }

    // Get the next question number if not provided
    let nextNumber = question_number;
    if (!nextNumber) {
      const maxResult = await c.env.DB.prepare(`
        SELECT MAX(question_number) as max_number FROM template_questions WHERE template_id = ?
      `).bind(templateId).first<any>();
      nextNumber = (maxResult?.max_number || 0) + 1;
    }

    // Default answer_length to 50 if not provided
    const finalAnswerLength = answer_length || 50;

    // Insert question
    const result = await c.env.DB.prepare(`
      INSERT INTO template_questions (template_id, question_number, question_text, question_text_en, answer_length, question_type, options, correct_answer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      templateId, 
      nextNumber, 
      question_text, 
      question_text_en || null, 
      finalAnswerLength,
      question_type,
      options,
      correct_answer
    ).run();

    return c.json({ 
      message: 'Question added successfully',
      id: result.meta.last_row_id
    });
  } catch (error) {
    console.error('Add question error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Update a question
templates.put('/:templateId/questions/:questionId', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('templateId');
    const questionId = c.req.param('questionId');
    const { 
      question_text, 
      question_text_en, 
      question_number, 
      answer_length,
      question_type = 'text',
      options = null,
      correct_answer = null
    } = await c.req.json();

    if (!question_text) {
      return c.json({ error: 'Question text is required' }, 400);
    }

    // Validate question type
    if (!['text', 'single_choice', 'multiple_choice'].includes(question_type)) {
      return c.json({ error: 'Invalid question type' }, 400);
    }

    // Validate choice questions
    if (question_type === 'single_choice' || question_type === 'multiple_choice') {
      if (!options) {
        return c.json({ error: 'Options are required for choice questions' }, 400);
      }
      
      try {
        const parsedOptions = JSON.parse(options);
        if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
          return c.json({ error: 'Options must be a non-empty array' }, 400);
        }
      } catch (e) {
        return c.json({ error: 'Invalid options format' }, 400);
      }
      
      if (!correct_answer) {
        return c.json({ error: 'Correct answer is required for choice questions' }, 400);
      }
    }

    // Check template ownership
    const template = await c.env.DB.prepare(`
      SELECT id, created_by FROM templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Permission check: Premium users can only edit their own templates
    if (user.role === 'premium' && template.created_by !== user.id) {
      return c.json({ error: 'You can only edit your own templates' }, 403);
    }

    // Default answer_length to 50 if not provided
    const finalAnswerLength = answer_length !== undefined ? answer_length : 50;

    // Update question
    await c.env.DB.prepare(`
      UPDATE template_questions
      SET question_text = ?,
          question_text_en = ?,
          question_number = ?,
          answer_length = ?,
          question_type = ?,
          options = ?,
          correct_answer = ?
      WHERE id = ? AND template_id = ?
    `).bind(
      question_text,
      question_text_en || null,
      question_number,
      finalAnswerLength,
      question_type,
      options,
      correct_answer,
      questionId,
      templateId
    ).run();

    return c.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Delete a question
templates.delete('/:templateId/questions/:questionId', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('templateId');
    const questionId = c.req.param('questionId');

    // Check template ownership
    const template = await c.env.DB.prepare(`
      SELECT id, created_by FROM templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Permission check: Premium users can only edit their own templates
    if (user.role === 'premium' && template.created_by !== user.id) {
      return c.json({ error: 'You can only edit your own templates' }, 403);
    }

    // Delete question
    await c.env.DB.prepare(`
      DELETE FROM template_questions
      WHERE id = ? AND template_id = ?
    `).bind(questionId, templateId).run();

    return c.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Reorder questions
templates.put('/:id/questions/reorder', premiumOrAdmin, async (c) => {
  try {
    const templateId = c.req.param('id');
    const { questions } = await c.req.json(); // Array of { id, question_number }

    if (!Array.isArray(questions)) {
      return c.json({ error: 'Questions array is required' }, 400);
    }

    // Update each question's number
    for (const q of questions) {
      await c.env.DB.prepare(`
        UPDATE template_questions
        SET question_number = ?
        WHERE id = ? AND template_id = ?
      `).bind(q.question_number, q.id, templateId).run();
    }

    return c.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    console.error('Reorder questions error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default templates;
