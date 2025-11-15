import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

// Public endpoint: Get latest 3 testimonials (for homepage)
app.get('/latest', async (c: Context) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, role, content, 
             avatar_url, rating, created_at
      FROM testimonials
      WHERE is_featured = 1
      ORDER BY created_at DESC
      LIMIT 3
    `).all();
    
    return c.json({ testimonials: result.results });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

// Public endpoint: Create testimonial (public access - pending approval)
app.post('/public', async (c: Context) => {
  try {
    const { name, role, content, rating } = await c.req.json();
    
    // Validation
    if (!name || !content) {
      return c.json({ error: 'Name and content are required' }, 400);
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }
    
    // Create testimonial with is_featured = 0 (needs admin approval)
    const result = await c.env.DB.prepare(`
      INSERT INTO testimonials (
        name, role, content, rating, is_featured, display_order
      ) VALUES (?, ?, ?, ?, 0, 999)
    `).bind(
      name,
      role || 'Visitor', // Use provided role or default to 'Visitor'
      content,
      rating || 5
    ).run();
    
    return c.json({ 
      message: 'Thank you for your message! It will be reviewed and published soon.',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Error creating public testimonial:', error);
    return c.json({ error: 'Failed to submit message' }, 500);
  }
});

// Admin endpoints: CRUD operations
// Get all testimonials (admin only)
app.get('/admin/all', authMiddleware, adminOnly, async (c: Context) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, role, content,
             avatar_url, rating, is_featured, display_order,
             created_at, updated_at
      FROM testimonials
      ORDER BY display_order ASC, created_at DESC
    `).all();
    
    return c.json({ testimonials: result.results });
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

// Get single testimonial (admin only)
app.get('/admin/:id', authMiddleware, adminOnly, async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, role, content,
             avatar_url, rating, is_featured, display_order,
             created_at, updated_at
      FROM testimonials
      WHERE id = ?
    `).bind(id).first();
    
    if (!result) {
      return c.json({ error: 'Testimonial not found' }, 404);
    }
    
    return c.json({ testimonial: result });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return c.json({ error: 'Failed to fetch testimonial' }, 500);
  }
});

// Create testimonial (admin only)
app.post('/admin', authMiddleware, adminOnly, async (c: Context) => {
  try {
    const { name, role, content, 
            avatar_url, rating, is_featured, display_order } = await c.req.json();
    
    // Validation
    if (!name || !role || !content) {
      return c.json({ error: 'Name, role, and content are required' }, 400);
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO testimonials (
        name, role, content,
        avatar_url, rating, is_featured, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      role,
      content,
      avatar_url || null,
      rating || 5,
      is_featured ? 1 : 0,
      display_order || 0
    ).run();
    
    return c.json({ 
      message: 'Testimonial created successfully',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return c.json({ error: 'Failed to create testimonial' }, 500);
  }
});

// Update testimonial (admin only)
app.put('/admin/:id', authMiddleware, adminOnly, async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  
  try {
    const { name, role, content,
            avatar_url, rating, is_featured, display_order } = await c.req.json();
    
    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      UPDATE testimonials
      SET name = ?,
          role = ?,
          content = ?,
          avatar_url = ?,
          rating = ?,
          is_featured = ?,
          display_order = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      role,
      content,
      avatar_url || null,
      rating || 5,
      is_featured ? 1 : 0,
      display_order || 0,
      id
    ).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Testimonial not found' }, 404);
    }
    
    return c.json({ message: 'Testimonial updated successfully' });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return c.json({ error: 'Failed to update testimonial' }, 500);
  }
});

// Delete testimonial (admin only)
app.delete('/admin/:id', authMiddleware, adminOnly, async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await c.env.DB.prepare(`
      DELETE FROM testimonials WHERE id = ?
    `).bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Testimonial not found' }, 404);
    }
    
    return c.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return c.json({ error: 'Failed to delete testimonial' }, 500);
  }
});

export default app;
