import { Hono } from 'hono';
import { authMiddleware, UserPayload } from '../middleware/auth';

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
            CASE WHEN ? = 'en' AND question_text_en IS NOT NULL THEN question_text_en ELSE question_text END as question_text
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
        CASE WHEN ? = 'en' AND question_text_en IS NOT NULL THEN question_text_en ELSE question_text END as question_text
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

export default templates;
