import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const keywords = new Hono<{ Bindings: Bindings }>();

// Get all keywords (admin only)
keywords.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const userRole = c.req.header('X-User-Role');

    if (!userId || userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const result = await c.env.DB.prepare(`
      SELECT id, keyword, language, type, is_active, created_at, updated_at
      FROM search_keywords
      ORDER BY language, type, id
    `).all();

    return c.json({ keywords: result.results || [] });
  } catch (error) {
    console.error('Failed to get keywords:', error);
    return c.json({ error: 'Failed to get keywords' }, 500);
  }
});

// Get keywords by language and type
keywords.get('/filter', async (c) => {
  try {
    const language = c.req.query('language');
    const type = c.req.query('type');

    let query = 'SELECT * FROM search_keywords WHERE 1=1';
    const params: any[] = [];

    if (language) {
      query += ' AND language = ?';
      params.push(language);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY id';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ keywords: result.results || [] });
  } catch (error) {
    console.error('Failed to filter keywords:', error);
    return c.json({ error: 'Failed to filter keywords' }, 500);
  }
});

// Create new keyword (admin only)
keywords.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const userRole = c.req.header('X-User-Role');

    if (!userId || userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const { keyword, language, type, is_active } = await c.req.json();

    // Validate required fields
    if (!keyword || !language || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Validate language
    if (!['zh', 'en', 'ja', 'es'].includes(language)) {
      return c.json({ error: 'Invalid language' }, 400);
    }

    // Validate type
    if (!['article', 'video'].includes(type)) {
      return c.json({ error: 'Invalid type' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO search_keywords (keyword, language, type, is_active)
      VALUES (?, ?, ?, ?)
    `).bind(keyword, language, type, is_active !== undefined ? is_active : 1).run();

    return c.json({ 
      id: result.meta.last_row_id,
      keyword,
      language,
      type,
      is_active: is_active !== undefined ? is_active : 1
    }, 201);
  } catch (error) {
    console.error('Failed to create keyword:', error);
    return c.json({ error: 'Failed to create keyword' }, 500);
  }
});

// Update keyword (admin only)
keywords.put('/:id', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const userRole = c.req.header('X-User-Role');

    if (!userId || userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const { keyword, language, type, is_active } = await c.req.json();

    // Validate required fields
    if (!keyword || !language || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Validate language
    if (!['zh', 'en', 'ja', 'es'].includes(language)) {
      return c.json({ error: 'Invalid language' }, 400);
    }

    // Validate type
    if (!['article', 'video'].includes(type)) {
      return c.json({ error: 'Invalid type' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE search_keywords
      SET keyword = ?, language = ?, type = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(keyword, language, type, is_active !== undefined ? is_active : 1, id).run();

    return c.json({ 
      id,
      keyword,
      language,
      type,
      is_active: is_active !== undefined ? is_active : 1
    });
  } catch (error) {
    console.error('Failed to update keyword:', error);
    return c.json({ error: 'Failed to update keyword' }, 500);
  }
});

// Delete keyword (admin only)
keywords.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const userRole = c.req.header('X-User-Role');

    if (!userId || userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');

    await c.env.DB.prepare(`
      DELETE FROM search_keywords WHERE id = ?
    `).bind(id).run();

    return c.json({ message: 'Keyword deleted successfully' });
  } catch (error) {
    console.error('Failed to delete keyword:', error);
    return c.json({ error: 'Failed to delete keyword' }, 500);
  }
});

// Toggle keyword active status (admin only)
keywords.patch('/:id/toggle', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const userRole = c.req.header('X-User-Role');

    if (!userId || userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');

    await c.env.DB.prepare(`
      UPDATE search_keywords
      SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return c.json({ message: 'Keyword status toggled successfully' });
  } catch (error) {
    console.error('Failed to toggle keyword status:', error);
    return c.json({ error: 'Failed to toggle keyword status' }, 500);
  }
});

export default keywords;
