import { Hono } from 'hono';
import { authMiddleware, UserPayload, adminOnly, premiumOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const templates = new Hono();

// Apply auth middleware to all template routes
templates.use('/*', authMiddleware);

// Helper function to get language from request
function getLanguage(c: any): string {
  // Try X-Language header first
  const xLanguage = c.req.header('X-Language');
  if (xLanguage && ['en', 'zh', 'zh-TW', 'fr', 'ja', 'es'].includes(xLanguage)) {
    return xLanguage;
  }
  
  // Try Accept-Language header
  const acceptLanguage = c.req.header('Accept-Language') || '';
  if (acceptLanguage.includes('zh-TW') || acceptLanguage.includes('zh-Hant')) {
    return 'zh-TW';
  }
  if (acceptLanguage.includes('zh')) {
    return 'zh';
  }
  
  // Default to English
  return 'en';
}

// Get all active templates with their questions
templates.get('/', async (c) => {
  try {
    const user = c.get('user') as any;
    const lang = getLanguage(c);
    
    // Get all active templates with owner filtering
    const templatesResult = await c.env.DB.prepare(`
      SELECT 
        id, 
        name,
        description,
        is_default,
        owner,
        created_by,
        created_at,
        price
      FROM templates
      WHERE is_active = 1
        AND (
          owner = 'public'
          OR owner = 'system'
          OR created_by = ?
          OR ? = 'admin'
          OR (owner = 'team' AND EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = ? AND tm.team_id IN (
              SELECT team_id FROM team_members WHERE user_id = created_by
            )
          ))
        )
      ORDER BY is_default DESC, created_at DESC
    `).bind(user.id, user.role, user.id).all();

    const templateList = templatesResult.results || [];

    // Get questions for each template with language-specific text
    const templatesWithQuestions = await Promise.all(
      templateList.map(async (template: any) => {
        const questionsResult = await c.env.DB.prepare(`
          SELECT 
            question_number,
            question_text,
            answer_length,
            question_type,
            options,
            correct_answer,
            owner,
            required
          FROM template_questions
          WHERE template_id = ?
          ORDER BY question_number ASC
        `).bind(template.id).all();

        return {
          ...template,
          questions: questionsResult.results || []
        };
      })
    );

    return c.json({ templates: templatesWithQuestions });
  } catch (error: any) {
    console.error('[GET /api/templates] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('获取模板列表失败: ' + (error.message || 'Unknown error'), 500, { originalError: error.message });
  }
});

// Get a specific template with its questions
templates.get('/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');
    const lang = getLanguage(c);

    // Get template with owner filtering
    const template = await c.env.DB.prepare(`
      SELECT 
        id, 
        name,
        description,
        is_default,
        owner,
        created_by,
        created_at,
        price
      FROM templates
      WHERE id = ? 
        AND is_active = 1
        AND (
          owner = 'public'
          OR created_by = ?
          OR ? = 'admin'
          OR (owner = 'team' AND EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = ? AND tm.team_id IN (
              SELECT team_id FROM team_members WHERE user_id = created_by
            )
          ))
        )
    `).bind(templateId, user.userId || user.id, user.role, user.userId || user.id).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Get questions
    const questionsResult = await c.env.DB.prepare(`
      SELECT 
        question_number,
        question_text,
        answer_length,
        question_type,
        options,
        correct_answer,
        owner,
        required
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
  } catch (error: any) {
    console.error('[GET /api/templates/:id] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('获取模板详情失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
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
        t.description,
        t.is_default,
        t.is_active,
        t.owner,
        t.created_at,
        t.updated_at,
        t.created_by,
        t.price,
        t.price_basic,
        t.price_premium,
        t.price_super,
        u.username as creator_name,
        u.role as creator_role
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
    `;
    
    if (user.role === 'premium') {
      query += ` WHERE t.created_by = ?`;
    }
    
    // Sort by: is_active DESC (active first), is_default DESC, created_at DESC
    query += ` ORDER BY t.is_active DESC, t.is_default DESC, t.created_at DESC`;
    
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
  } catch (error: any) {
    console.error('[GET /api/templates/admin/all] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('获取所有模板失败: ' + (error.message || 'Unknown error'), 500, { originalError: error.message });
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
        description,
        is_default,
        is_active,
        owner,
        created_at,
        updated_at,
        price,
        price_basic,
        price_premium,
        price_super
      FROM templates
      WHERE id = ?
    `).bind(templateId).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Get all questions
    const questionsResult = await c.env.DB.prepare(`
      SELECT 
        id,
        question_number,
        question_text,
        answer_length,
        question_type,
        options,
        correct_answer,
        owner,
        required
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
  } catch (error: any) {
    console.error('[GET /api/templates/admin/:id] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('获取模板（管理员）失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
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
    
    const { name, description, is_default, owner, price } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Template name is required' }, 400);
    }

    // Validate owner value
    if (owner && !['private', 'team', 'public'].includes(owner)) {
      return c.json({ error: 'Invalid owner value' }, 400);
    }

    // Validate and parse price (default to 0.0 if not provided)
    let templatePrice = 0.0;
    if (price !== undefined && price !== null) {
      templatePrice = parseFloat(price);
      if (isNaN(templatePrice) || templatePrice < 0) {
        return c.json({ error: 'Price must be a non-negative number' }, 400);
      }
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
      INSERT INTO templates (name, description, is_default, is_active, owner, created_by, price)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `).bind(
      name,
      description || null,
      actualIsDefault ? 1 : 0,
      owner || 'public',
      user.id,
      templatePrice
    ).run();

    return c.json({ 
      message: 'Template created successfully',
      id: result.meta.last_row_id 
    });
  } catch (error: any) {
    console.error('[POST /api/templates] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('创建模板失败: ' + (error.message || 'Unknown error'), 500, { originalError: error.message });
  }
});

// Admin: Update a template
templates.put('/:id', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');
    const { name, description, is_default, is_active, owner, price_basic, price_premium, price_super } = await c.req.json();

    // Validate owner value
    if (owner && !['private', 'team', 'public'].includes(owner)) {
      return c.json({ error: 'Invalid owner value' }, 400);
    }

    // Validate and parse tiered prices
    let priceBasicValue: number | undefined = undefined;
    let pricePremiumValue: number | undefined = undefined;
    let priceSuperValue: number | undefined = undefined;
    
    if (price_basic !== undefined && price_basic !== null) {
      priceBasicValue = parseFloat(price_basic);
      if (isNaN(priceBasicValue) || priceBasicValue < 0) {
        return c.json({ error: 'Price (Basic) must be a non-negative number' }, 400);
      }
    }
    
    if (price_premium !== undefined && price_premium !== null) {
      pricePremiumValue = parseFloat(price_premium);
      if (isNaN(pricePremiumValue) || pricePremiumValue < 0) {
        return c.json({ error: 'Price (Premium) must be a non-negative number' }, 400);
      }
    }
    
    if (price_super !== undefined && price_super !== null) {
      priceSuperValue = parseFloat(price_super);
      if (isNaN(priceSuperValue) || priceSuperValue < 0) {
        return c.json({ error: 'Price (Super) must be a non-negative number' }, 400);
      }
    }

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

    // Update template with tiered prices
    const hasPriceUpdates = priceBasicValue !== undefined || pricePremiumValue !== undefined || priceSuperValue !== undefined;
    
    const updateQuery = hasPriceUpdates
      ? `UPDATE templates
         SET name = ?,
             description = ?,
             is_default = ?,
             is_active = ?,
             owner = ?,
             price_basic = COALESCE(?, price_basic),
             price_premium = COALESCE(?, price_premium),
             price_super = COALESCE(?, price_super),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      : `UPDATE templates
         SET name = ?,
             description = ?,
             is_default = ?,
             is_active = ?,
             owner = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`;
    
    const updateParams = hasPriceUpdates
      ? [
          name,
          description || null,
          actualIsDefault ? 1 : 0,
          is_active ? 1 : 0,
          owner || 'public',
          priceBasicValue,
          pricePremiumValue,
          priceSuperValue,
          templateId
        ]
      : [
          name,
          description || null,
          actualIsDefault ? 1 : 0,
          is_active ? 1 : 0,
          owner || 'public',
          templateId
        ];
    
    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();

    return c.json({ message: 'Template updated successfully' });
  } catch (error: any) {
    console.error('[PUT /api/templates/:id] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('更新模板失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
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

    // If template is being used, only disable it (soft delete)
    if (usageCheck && usageCheck.count > 0) {
      await c.env.DB.prepare(`
        UPDATE templates SET is_active = 0 WHERE id = ?
      `).bind(templateId).run();
      
      return c.json({ 
        message: 'Template has been disabled because it is being used by reviews',
        disabled: true,
        affected_reviews: usageCheck.count
      });
    }

    // If template is not being used, hard delete it
    await c.env.DB.prepare(`
      DELETE FROM template_questions WHERE template_id = ?
    `).bind(templateId).run();
    
    await c.env.DB.prepare(`
      DELETE FROM templates WHERE id = ?
    `).bind(templateId).run();
    
    return c.json({ 
      message: 'Template deleted successfully',
      disabled: false,
      affected_reviews: 0
    });
  } catch (error: any) {
    console.error('[DELETE /api/templates/:id] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('删除模板失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
  }
});

// Toggle template status (Admin only)
templates.post('/:id/toggle-status', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');

    // Check if template exists
    const template = await c.env.DB.prepare(`
      SELECT id, is_active, created_by FROM templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Permission check: Premium users can only toggle their own templates
    if (user.role === 'premium' && template.created_by !== user.id) {
      return c.json({ error: 'You can only modify your own templates' }, 403);
    }

    // Toggle is_active status
    const newStatus = template.is_active === 1 ? 0 : 1;
    await c.env.DB.prepare(`
      UPDATE templates 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStatus, templateId).run();

    return c.json({
      success: true,
      message: `模板已${newStatus === 1 ? '上架' : '下架'}`,
      is_active: newStatus
    });
  } catch (error: any) {
    console.error('[POST /api/templates/:id/toggle-status] Error:', error);
    throw createError('切换模板状态失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
  }
});

// Admin: Add a question to a template
templates.post('/:id/questions', premiumOrAdmin, async (c) => {
  try {
    const user = c.get('user') as any;
    const templateId = c.req.param('id');
    const { 
      question_text, 
      question_number, 
      answer_length,
      question_type = 'text',
      options = null,
      correct_answer = null,
      datetime_value = null,
      datetime_title = null,
      datetime_answer_max_length = 200,
      owner = 'public',
      required = 'no'
    } = await c.req.json();

    if (!question_text) {
      return c.json({ error: 'Question text is required' }, 400);
    }

    // Validate question type
    if (!['text', 'single_choice', 'multiple_choice', 'time_with_text'].includes(question_type)) {
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
      INSERT INTO template_questions (
        template_id, question_number, question_text, 
        answer_length, question_type, options, correct_answer,
        datetime_value, datetime_title, datetime_answer_max_length,
        owner, required
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      templateId, 
      nextNumber, 
      question_text, 
      finalAnswerLength,
      question_type,
      options,
      correct_answer,
      datetime_value,
      datetime_title,
      datetime_answer_max_length,
      owner,
      required
    ).run();

    return c.json({ 
      message: 'Question added successfully',
      id: result.meta.last_row_id
    });
  } catch (error: any) {
    console.error('[POST /api/templates/:id/questions] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('添加问题失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
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
      question_number, 
      answer_length,
      question_type = 'text',
      options = null,
      correct_answer = null,
      datetime_value = null,
      datetime_title = null,
      datetime_answer_max_length = 200,
      owner = 'public',
      required = 'no'
    } = await c.req.json();

    if (!question_text) {
      return c.json({ error: 'Question text is required' }, 400);
    }

    // Validate question type
    if (!['text', 'single_choice', 'multiple_choice', 'time_with_text'].includes(question_type)) {
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
          question_number = ?,
          answer_length = ?,
          question_type = ?,
          options = ?,
          correct_answer = ?,
          datetime_value = ?,
          datetime_title = ?,
          datetime_answer_max_length = ?,
          owner = ?,
          required = ?
      WHERE id = ? AND template_id = ?
    `).bind(
      question_text,
      question_number,
      finalAnswerLength,
      question_type,
      options,
      correct_answer,
      datetime_value,
      datetime_title,
      datetime_answer_max_length,
      owner,
      required,
      questionId,
      templateId
    ).run();

    return c.json({ message: 'Question updated successfully' });
  } catch (error: any) {
    console.error('[PUT /api/templates/:templateId/questions/:questionId] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('更新问题失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('templateId'), questionId: c.req.param('questionId'), originalError: error.message });
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
  } catch (error: any) {
    console.error('[DELETE /api/templates/:templateId/questions/:questionId] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('删除问题失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('templateId'), questionId: c.req.param('questionId'), originalError: error.message });
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
  } catch (error: any) {
    console.error('[POST /api/templates/:id/questions/reorder] Error:', error);
    console.error('Stack:', error.stack);
    throw createError('重新排序问题失败: ' + (error.message || 'Unknown error'), 500, { templateId: c.req.param('id'), originalError: error.message });
  }
});

export default templates;
