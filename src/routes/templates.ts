import { Hono } from 'hono';
import { authMiddleware, UserPayload } from '../middleware/auth';

const templates = new Hono();

// Apply auth middleware to all template routes
templates.use('/*', authMiddleware);

// Get all active templates with their questions
templates.get('/', async (c) => {
  try {
    // Get all active templates
    const templatesResult = await c.env.DB.prepare(`
      SELECT id, name, description, is_default, created_at
      FROM templates
      WHERE is_active = 1
      ORDER BY is_default DESC, created_at DESC
    `).all();

    const templateList = templatesResult.results || [];

    // Get questions for each template
    const templatesWithQuestions = await Promise.all(
      templateList.map(async (template: any) => {
        const questionsResult = await c.env.DB.prepare(`
          SELECT question_number, question_text
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
  } catch (error) {
    console.error('Get templates error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get a specific template with its questions
templates.get('/:id', async (c) => {
  try {
    const templateId = c.req.param('id');

    // Get template
    const template = await c.env.DB.prepare(`
      SELECT id, name, description, is_default, created_at
      FROM templates
      WHERE id = ? AND is_active = 1
    `).bind(templateId).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Get questions
    const questionsResult = await c.env.DB.prepare(`
      SELECT question_number, question_text
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
    console.error('Get template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default templates;
