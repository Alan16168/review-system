// Writing Templates Routes
// Handles AI writing templates (similar to review templates)

import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware only to mutation routes (POST, PUT, DELETE)
// GET routes should work for both authenticated and non-authenticated users
app.use('/', async (c, next) => {
  const method = c.req.method;
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return authMiddleware(c, next);
  }
  // For GET requests, try to get user but don't require it
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const jwtSecret = c.env.JWT_SECRET;
      const { verifyToken } = await import('../utils/auth');
      const user = verifyToken(token, jwtSecret);
      if (user) {
        c.set('user', user);
      }
    } catch (error) {
      // Ignore auth errors for GET requests
    }
  }
  await next();
});

// Admin-only middleware for mutation routes
app.use('/', async (c, next) => {
  const method = c.req.method;
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return adminOnly(c, next);
  }
  await next();
});

// ============================================================================
// GET /api/writing-templates - Get all writing templates
// ============================================================================
app.get('/', async (c) => {
  try {
    const { DB } = c.env;
    const user = c.get('user');
    
    // Get all active templates (public ones + user's own templates)
    let query = `
      SELECT 
        t.*,
        u.username as creator_name,
        tm.name as team_name,
        (SELECT COUNT(*) FROM ai_writing_template_fields WHERE template_id = t.id AND is_active = 1) as field_count
      FROM ai_writing_templates t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      WHERE t.is_active = 1
    `;
    
    // Only add owner filter if user exists and is not admin
    if (user && user.role !== 'admin') {
      query += ` AND (t.is_public = 1 OR t.owner_id = ?)`;
    } else if (!user) {
      // If no user, only show public templates
      query += ` AND t.is_public = 1`;
    }
    // If user is admin, show all active templates (no additional filter)
    
    query += ` ORDER BY t.is_featured DESC, t.sort_order ASC, t.created_at DESC`;
    
    const stmt = DB.prepare(query);
    const result = user && user.role !== 'admin' 
      ? await stmt.bind(user.id).all()
      : await stmt.all();

    return c.json({
      success: true,
      templates: result.results || []
    });
  } catch (error: any) {
    console.error('Error fetching writing templates:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/writing-templates/:id - Get specific template
// ============================================================================
app.get('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));
    
    // Get template details
    const template: any = await DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_name,
        tm.name as team_name
      FROM ai_writing_templates t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      WHERE t.id = ?
    `).bind(id).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Get template fields
    const fieldsResult = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields
      WHERE template_id = ? AND is_active = 1
      ORDER BY sort_order ASC
    `).bind(id).all();

    return c.json({
      success: true,
      template: {
        ...template,
        fields: fieldsResult.results || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/writing-templates - Create new template (Admin only)
// ============================================================================
app.post('/', async (c) => {
  try {
    const { DB } = c.env;
    const user = c.get('user');
    const body = await c.req.json();

    const {
      name,
      name_en,
      description,
      description_en,
      category,
      icon,
      color,
      tags,
      default_tone,
      default_audience,
      default_language,
      default_target_words,
      is_public,
      is_featured,
      fields
    } = body;

    // Validate required fields
    if (!name || !category) {
      return c.json({ 
        error: 'Missing required fields: name, category' 
      }, 400);
    }

    // Insert template
    const result = await DB.prepare(`
      INSERT INTO ai_writing_templates (
        owner_id, owner_type, name, name_en, description, description_en,
        category, icon, color, tags,
        default_tone, default_audience, default_language, default_target_words,
        is_active, is_public, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      'individual',
      name,
      name_en || null,
      description || null,
      description_en || null,
      category,
      icon || 'book',
      color || 'blue',
      tags || null,
      default_tone || 'professional',
      default_audience || 'general',
      default_language || 'zh',
      default_target_words || 50000,
      1, // is_active
      is_public ? 1 : 0,
      is_featured ? 1 : 0
    ).run();

    const templateId = result.meta.last_row_id;

    // Insert fields if provided
    if (fields && Array.isArray(fields)) {
      for (const field of fields) {
        await DB.prepare(`
          INSERT INTO ai_writing_template_fields (
            template_id, field_key, field_type, label, label_en,
            placeholder, default_value, options_json,
            is_required, min_length, max_length, validation_regex,
            help_text, help_text_en, sort_order, group_name, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          templateId,
          field.field_key,
          field.field_type,
          field.label,
          field.label_en || null,
          field.placeholder || null,
          field.default_value || null,
          field.options_json ? JSON.stringify(field.options_json) : null,
          field.is_required ? 1 : 0,
          field.min_length || null,
          field.max_length || null,
          field.validation_regex || null,
          field.help_text || null,
          field.help_text_en || null,
          field.sort_order || 0,
          field.group_name || null,
          1 // is_active
        ).run();
      }
    }

    // Get created template with fields
    const created: any = await DB.prepare(`
      SELECT * FROM ai_writing_templates WHERE id = ?
    `).bind(templateId).first();

    const fieldsResult = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields
      WHERE template_id = ? AND is_active = 1
      ORDER BY sort_order ASC
    `).bind(templateId).all();

    return c.json({
      success: true,
      template: {
        ...created,
        fields: fieldsResult.results || []
      },
      message: 'Template created successfully'
    }, 201);
  } catch (error: any) {
    console.error('Error creating template:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/writing-templates/:id - Update template (Admin only)
// ============================================================================
app.put('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    // Verify template exists
    const existing = await DB.prepare(`
      SELECT * FROM ai_writing_templates WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    const {
      name,
      name_en,
      description,
      description_en,
      category,
      icon,
      color,
      tags,
      default_tone,
      default_audience,
      default_language,
      default_target_words,
      is_public,
      is_featured,
      is_active
    } = body;

    // Update template
    await DB.prepare(`
      UPDATE ai_writing_templates SET
        name = ?,
        name_en = ?,
        description = ?,
        description_en = ?,
        category = ?,
        icon = ?,
        color = ?,
        tags = ?,
        default_tone = ?,
        default_audience = ?,
        default_language = ?,
        default_target_words = ?,
        is_public = ?,
        is_featured = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      name_en || null,
      description || null,
      description_en || null,
      category,
      icon || 'book',
      color || 'blue',
      tags || null,
      default_tone || 'professional',
      default_audience || 'general',
      default_language || 'zh',
      default_target_words || 50000,
      is_public ? 1 : 0,
      is_featured ? 1 : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      id
    ).run();

    // Get updated template
    const updated: any = await DB.prepare(`
      SELECT * FROM ai_writing_templates WHERE id = ?
    `).bind(id).first();

    const fieldsResult = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields
      WHERE template_id = ? AND is_active = 1
      ORDER BY sort_order ASC
    `).bind(id).all();

    return c.json({
      success: true,
      template: {
        ...updated,
        fields: fieldsResult.results || []
      },
      message: 'Template updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/writing-templates/:id - Delete template (Admin only)
// ============================================================================
app.delete('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    // Verify template exists
    const existing = await DB.prepare(`
      SELECT * FROM ai_writing_templates WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Soft delete (set is_active = 0)
    await DB.prepare(`
      UPDATE ai_writing_templates 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/writing-templates/:id/fields - Add field to template (Admin only)
// ============================================================================
app.post('/:id/fields', async (c) => {
  try {
    const { DB } = c.env;
    const templateId = parseInt(c.req.param('id'));
    const body = await c.req.json();

    // Verify template exists
    const template = await DB.prepare(`
      SELECT * FROM ai_writing_templates WHERE id = ?
    `).bind(templateId).first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    const {
      field_key,
      field_type,
      label,
      label_en,
      placeholder,
      default_value,
      options_json,
      is_required,
      min_length,
      max_length,
      validation_regex,
      help_text,
      help_text_en,
      sort_order,
      group_name
    } = body;

    // Validate required fields
    if (!field_key || !field_type || !label) {
      return c.json({ 
        error: 'Missing required fields: field_key, field_type, label' 
      }, 400);
    }

    // Insert field
    const result = await DB.prepare(`
      INSERT INTO ai_writing_template_fields (
        template_id, field_key, field_type, label, label_en,
        placeholder, default_value, options_json,
        is_required, min_length, max_length, validation_regex,
        help_text, help_text_en, sort_order, group_name, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      templateId,
      field_key,
      field_type,
      label,
      label_en || null,
      placeholder || null,
      default_value || null,
      options_json ? JSON.stringify(options_json) : null,
      is_required ? 1 : 0,
      min_length || null,
      max_length || null,
      validation_regex || null,
      help_text || null,
      help_text_en || null,
      sort_order || 0,
      group_name || null,
      1 // is_active
    ).run();

    const fieldId = result.meta.last_row_id;

    // Get created field
    const created = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields WHERE id = ?
    `).bind(fieldId).first();

    return c.json({
      success: true,
      field: created,
      message: 'Field added successfully'
    }, 201);
  } catch (error: any) {
    console.error('Error adding field:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/writing-templates/:id/fields/:fieldId - Update field (Admin only)
// ============================================================================
app.put('/:id/fields/:fieldId', async (c) => {
  try {
    const { DB } = c.env;
    const templateId = parseInt(c.req.param('id'));
    const fieldId = parseInt(c.req.param('fieldId'));
    const body = await c.req.json();

    // Verify field exists and belongs to template
    const existing = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields 
      WHERE id = ? AND template_id = ?
    `).bind(fieldId, templateId).first();

    if (!existing) {
      return c.json({ error: 'Field not found' }, 404);
    }

    const {
      field_key,
      field_type,
      label,
      label_en,
      placeholder,
      default_value,
      options_json,
      is_required,
      min_length,
      max_length,
      validation_regex,
      help_text,
      help_text_en,
      sort_order,
      group_name,
      is_active
    } = body;

    // Update field
    await DB.prepare(`
      UPDATE ai_writing_template_fields SET
        field_key = ?,
        field_type = ?,
        label = ?,
        label_en = ?,
        placeholder = ?,
        default_value = ?,
        options_json = ?,
        is_required = ?,
        min_length = ?,
        max_length = ?,
        validation_regex = ?,
        help_text = ?,
        help_text_en = ?,
        sort_order = ?,
        group_name = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      field_key,
      field_type,
      label,
      label_en || null,
      placeholder || null,
      default_value || null,
      options_json ? JSON.stringify(options_json) : null,
      is_required ? 1 : 0,
      min_length || null,
      max_length || null,
      validation_regex || null,
      help_text || null,
      help_text_en || null,
      sort_order || 0,
      group_name || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      fieldId
    ).run();

    // Get updated field
    const updated = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields WHERE id = ?
    `).bind(fieldId).first();

    return c.json({
      success: true,
      field: updated,
      message: 'Field updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating field:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/writing-templates/:id/fields/:fieldId - Delete field (Admin only)
// ============================================================================
app.delete('/:id/fields/:fieldId', async (c) => {
  try {
    const { DB } = c.env;
    const templateId = parseInt(c.req.param('id'));
    const fieldId = parseInt(c.req.param('fieldId'));

    // Verify field exists and belongs to template
    const existing = await DB.prepare(`
      SELECT * FROM ai_writing_template_fields 
      WHERE id = ? AND template_id = ?
    `).bind(fieldId, templateId).first();

    if (!existing) {
      return c.json({ error: 'Field not found' }, 404);
    }

    // Soft delete (set is_active = 0)
    await DB.prepare(`
      UPDATE ai_writing_template_fields 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fieldId).run();

    return c.json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting field:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
