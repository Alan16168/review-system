import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Helper: Get user from token
// ============================================================================

async function getUserFromToken(c: any): Promise<any> {
  // TEMPORARY: Use default user ID 1 for testing
  const user = await c.env.DB.prepare(
    'SELECT id, email, username, subscription_tier, is_admin FROM users WHERE id = ?'
  ).bind(1).first();
  
  if (!user) {
    throw new HTTPException(401, { message: 'User not found' });
  }
  
  return user;
}

// ============================================================================
// GET /api/writing-templates - List all templates
// ============================================================================

app.get('/', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const category = c.req.query('category');
    const publicOnly = c.req.query('public');
    
    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT f.id) as field_count
      FROM ai_writing_templates t
      LEFT JOIN ai_writing_template_fields f ON t.id = f.template_id AND f.is_active = 1
      WHERE t.is_active = 1
    `;
    
    const params: any[] = [];
    
    // Filter by category
    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }
    
    // Filter by visibility
    if (publicOnly === 'true') {
      query += ' AND t.is_public = 1';
    } else {
      // Show public templates or user's own templates
      query += ' AND (t.is_public = 1 OR t.owner_id = ? OR t.owner_type = ?)';
      params.push(user.id, 'system');
    }
    
    query += ' GROUP BY t.id';
    query += ' ORDER BY t.is_featured DESC, t.sort_order ASC, t.created_at DESC';
    
    const templates = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      templates: templates.results || []
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/writing-templates/:id - Get template details with fields
// ============================================================================

app.get('/:id', async (c) => {
  try {
    const templateId = c.req.param('id');
    
    // Get template
    const template = await c.env.DB.prepare(`
      SELECT * FROM ai_writing_templates WHERE id = ? AND is_active = 1
    `).bind(templateId).first();
    
    if (!template) {
      return c.json({ success: false, error: 'Template not found' }, 404);
    }
    
    // Get template fields
    const fields = await c.env.DB.prepare(`
      SELECT * FROM ai_writing_template_fields 
      WHERE template_id = ? AND is_active = 1
      ORDER BY sort_order ASC
    `).bind(templateId).all();
    
    return c.json({
      success: true,
      template: {
        ...template,
        fields: fields.results || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/writing-templates - Create new template (Admin only)
// ============================================================================

app.post('/', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.category) {
      return c.json({
        success: false,
        error: 'Name and category are required'
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO ai_writing_templates (
        owner_id, owner_type, name, name_en, description, description_en,
        category, icon, color, tags, default_tone, default_audience,
        default_language, default_target_words, chapter_generation_prompt,
        section_generation_prompt, content_generation_prompt,
        is_active, is_public, is_featured, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      body.owner_type || 'individual',
      body.name,
      body.name_en || null,
      body.description || null,
      body.description_en || null,
      body.category,
      body.icon || 'book',
      body.color || 'blue',
      body.tags || null,
      body.default_tone || 'professional',
      body.default_audience || 'general',
      body.default_language || 'zh',
      body.default_target_words || 50000,
      body.chapter_generation_prompt || null,
      body.section_generation_prompt || null,
      body.content_generation_prompt || null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      body.is_public ? 1 : 0,
      body.is_featured ? 1 : 0,
      body.sort_order || 0
    ).run();
    
    return c.json({
      success: true,
      template_id: result.meta.last_row_id,
      message: 'Template created successfully'
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/writing-templates/:id - Update template (Admin only)
// ============================================================================

app.put('/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const templateId = c.req.param('id');
    const body = await c.req.json();
    
    // Check if template exists
    const template = await c.env.DB.prepare(
      'SELECT id FROM ai_writing_templates WHERE id = ?'
    ).bind(templateId).first();
    
    if (!template) {
      return c.json({ success: false, error: 'Template not found' }, 404);
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    
    const fields = [
      'name', 'name_en', 'description', 'description_en', 'category',
      'icon', 'color', 'tags', 'default_tone', 'default_audience',
      'default_language', 'default_target_words', 'chapter_generation_prompt',
      'section_generation_prompt', 'content_generation_prompt',
      'is_active', 'is_public', 'is_featured', 'sort_order'
    ];
    
    fields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Convert boolean fields
        if (['is_active', 'is_public', 'is_featured'].includes(field)) {
          params.push(body[field] ? 1 : 0);
        } else {
          params.push(body[field]);
        }
      }
    });
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(templateId);
    
    await c.env.DB.prepare(
      `UPDATE ai_writing_templates SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();
    
    return c.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/writing-templates/:id - Delete template (Admin only)
// ============================================================================

app.delete('/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const templateId = c.req.param('id');
    
    // Soft delete (set is_active = 0)
    await c.env.DB.prepare(
      'UPDATE ai_writing_templates SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(templateId).run();
    
    return c.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/writing-templates/:id/fields - Add field to template (Admin only)
// ============================================================================

app.post('/:id/fields', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const templateId = c.req.param('id');
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.field_key || !body.field_type || !body.label) {
      return c.json({
        success: false,
        error: 'field_key, field_type, and label are required'
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO ai_writing_template_fields (
        template_id, field_key, field_type, label, label_en,
        placeholder, default_value, options_json, is_required,
        min_length, max_length, validation_regex, help_text,
        help_text_en, sort_order, group_name, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      templateId,
      body.field_key,
      body.field_type,
      body.label,
      body.label_en || null,
      body.placeholder || null,
      body.default_value || null,
      body.options_json || null,
      body.is_required ? 1 : 0,
      body.min_length || null,
      body.max_length || null,
      body.validation_regex || null,
      body.help_text || null,
      body.help_text_en || null,
      body.sort_order || 0,
      body.group_name || null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1
    ).run();
    
    return c.json({
      success: true,
      field_id: result.meta.last_row_id,
      message: 'Field added successfully'
    });
  } catch (error: any) {
    console.error('Error adding field:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/writing-templates/:templateId/fields/:fieldId - Update field
// ============================================================================

app.put('/:templateId/fields/:fieldId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const fieldId = c.req.param('fieldId');
    const body = await c.req.json();
    
    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    
    const fields = [
      'field_key', 'field_type', 'label', 'label_en', 'placeholder',
      'default_value', 'options_json', 'is_required', 'min_length',
      'max_length', 'validation_regex', 'help_text', 'help_text_en',
      'sort_order', 'group_name', 'is_active'
    ];
    
    fields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (['is_required', 'is_active'].includes(field)) {
          params.push(body[field] ? 1 : 0);
        } else {
          params.push(body[field]);
        }
      }
    });
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(fieldId);
    
    await c.env.DB.prepare(
      `UPDATE ai_writing_template_fields SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();
    
    return c.json({
      success: true,
      message: 'Field updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating field:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/writing-templates/:templateId/fields/:fieldId - Delete field
// ============================================================================

app.delete('/:templateId/fields/:fieldId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const fieldId = c.req.param('fieldId');
    
    // Soft delete
    await c.env.DB.prepare(
      'UPDATE ai_writing_template_fields SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(fieldId).run();
    
    return c.json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting field:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
