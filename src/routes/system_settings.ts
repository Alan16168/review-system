// System Settings Routes
// Handles system-wide configuration and settings

import { Hono } from 'hono';
import type { Context } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Helper: Check if user is admin
// ============================================================================
function checkAdminRole(c: Context): boolean {
  const userRole = c.req.header('X-User-Role');
  return userRole === 'admin';
}

// ============================================================================
// GET /api/system-settings - Get all settings (Admin only)
// ============================================================================
app.get('/', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available in system_settings');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing. Please configure it in Cloudflare Pages settings.'
      }, 500);
    }
    
    if (!checkAdminRole(c)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const { DB } = c.env;
    
    const result = await DB.prepare(`
      SELECT * FROM system_settings
      ORDER BY category, setting_key
    `).all();

    return c.json({
      success: true,
      settings: result.results || []
    });
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/system-settings/:key - Get specific setting by key
// ============================================================================
app.get('/:key', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing.'
      }, 500);
    }
    
    const key = c.req.param('key');
    const { DB } = c.env;
    
    const setting = await DB.prepare(`
      SELECT * FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    if (!setting) {
      return c.json({ error: 'Setting not found' }, 404);
    }

    // Parse value based on type
    let parsedValue: any = setting.setting_value;
    if (setting.setting_type === 'number') {
      parsedValue = parseFloat(setting.setting_value);
    } else if (setting.setting_type === 'boolean') {
      parsedValue = setting.setting_value === 'true';
    } else if (setting.setting_type === 'json') {
      parsedValue = JSON.parse(setting.setting_value);
    }

    return c.json({
      success: true,
      setting: {
        ...setting,
        parsed_value: parsedValue
      }
    });
  } catch (error: any) {
    console.error('Error fetching setting:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/system-settings/category/:category - Get settings by category
// ============================================================================
app.get('/category/:category', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing.'
      }, 500);
    }
    
    const category = c.req.param('category');
    const { DB } = c.env;
    
    try {
      const result = await DB.prepare(`
        SELECT * FROM system_settings WHERE category = ?
        ORDER BY setting_key
      `).bind(category).all();

      return c.json({
        success: true,
        settings: result.results || []
      });
    } catch (dbError: any) {
      // Table doesn't exist yet - return empty settings
      if (dbError.message && dbError.message.includes('no such table')) {
        console.warn('⚠️ system_settings table not found, returning empty settings');
        return c.json({
          success: true,
          settings: []
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error fetching settings by category:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/system-settings/:key - Update specific setting (Admin only)
// ============================================================================
app.put('/:key', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing.'
      }, 500);
    }
    
    if (!checkAdminRole(c)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const key = c.req.param('key');
    const { DB } = c.env;
    const body = await c.req.json();

    // Verify setting exists
    const existing = await DB.prepare(`
      SELECT * FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    if (!existing) {
      return c.json({ error: 'Setting not found' }, 404);
    }

    // Convert value to string based on type
    let stringValue = body.value;
    if (existing.setting_type === 'number') {
      const numValue = parseFloat(body.value);
      if (isNaN(numValue)) {
        return c.json({ error: 'Invalid number value' }, 400);
      }
      stringValue = numValue.toString();
    } else if (existing.setting_type === 'boolean') {
      stringValue = body.value ? 'true' : 'false';
    } else if (existing.setting_type === 'json') {
      stringValue = JSON.stringify(body.value);
    } else {
      stringValue = String(body.value);
    }

    // Update setting
    await DB.prepare(`
      UPDATE system_settings 
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `).bind(stringValue, key).run();

    // Get updated setting
    const updated = await DB.prepare(`
      SELECT * FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    return c.json({
      success: true,
      setting: updated,
      message: 'Setting updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/system-settings/batch - Batch update settings (Admin only)
// ============================================================================
app.put('/batch/update', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing.'
      }, 500);
    }
    
    if (!checkAdminRole(c)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const { DB } = c.env;
    const body = await c.req.json();
    const updates = body.settings; // Array of { key, value }

    if (!Array.isArray(updates)) {
      return c.json({ error: 'settings must be an array' }, 400);
    }

    let updatedCount = 0;
    const errors: any[] = [];

    for (const update of updates) {
      try {
        // Get setting type
        const existing: any = await DB.prepare(`
          SELECT * FROM system_settings WHERE setting_key = ?
        `).bind(update.key).first();

        if (!existing) {
          errors.push({ key: update.key, error: 'Setting not found' });
          continue;
        }

        // Convert value to string based on type
        let stringValue = update.value;
        if (existing.setting_type === 'number') {
          const numValue = parseFloat(update.value);
          if (isNaN(numValue)) {
            errors.push({ key: update.key, error: 'Invalid number value' });
            continue;
          }
          stringValue = numValue.toString();
        } else if (existing.setting_type === 'boolean') {
          stringValue = update.value ? 'true' : 'false';
        } else if (existing.setting_type === 'json') {
          stringValue = JSON.stringify(update.value);
        } else {
          stringValue = String(update.value);
        }

        // Update setting
        await DB.prepare(`
          UPDATE system_settings 
          SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = ?
        `).bind(stringValue, update.key).run();

        updatedCount++;
      } catch (err: any) {
        errors.push({ key: update.key, error: err.message });
      }
    }

    return c.json({
      success: true,
      updated_count: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Updated ${updatedCount} setting(s)`
    });
  } catch (error: any) {
    console.error('Error batch updating settings:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/system-settings - Create new setting (Admin only)
// ============================================================================
app.post('/', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing.'
      }, 500);
    }
    
    if (!checkAdminRole(c)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const { DB } = c.env;
    const body = await c.req.json();

    const { setting_key, setting_value, setting_type, category, description } = body;

    if (!setting_key || !setting_value || !setting_type || !category) {
      return c.json({ 
        error: 'Missing required fields: setting_key, setting_value, setting_type, category' 
      }, 400);
    }

    // Check if key already exists
    const existing = await DB.prepare(`
      SELECT * FROM system_settings WHERE setting_key = ?
    `).bind(setting_key).first();

    if (existing) {
      return c.json({ error: 'Setting key already exists' }, 409);
    }

    // Insert new setting
    const result = await DB.prepare(`
      INSERT INTO system_settings 
      (setting_key, setting_value, setting_type, category, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(setting_key, setting_value, setting_type, category, description || null).run();

    // Get created setting
    const created = await DB.prepare(`
      SELECT * FROM system_settings WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json({
      success: true,
      setting: created,
      message: 'Setting created successfully'
    }, 201);
  } catch (error: any) {
    console.error('Error creating setting:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
