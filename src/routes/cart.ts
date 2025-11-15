import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { UserPayload } from '../utils/auth';

type Bindings = {
  DB: D1Database;
};

const cart = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
cart.use('/*', authMiddleware);

// Get user's cart items
cart.get('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    const items = await c.env.DB.prepare(`
      SELECT * FROM shopping_cart 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({ 
      items: items.results || [],
      count: items.results?.length || 0
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add item to cart
cart.post('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const { item_type, subscription_tier, price_usd, duration_days, description } = await c.req.json();
    
    // Validate required fields
    if (!item_type || !subscription_tier || !price_usd || !duration_days) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Validate item_type
    if (!['upgrade', 'renewal'].includes(item_type)) {
      return c.json({ error: 'Invalid item type' }, 400);
    }
    
    // Check if item already exists in cart (prevent duplicates of same type)
    const existing = await c.env.DB.prepare(`
      SELECT id FROM shopping_cart 
      WHERE user_id = ? AND item_type = ? AND subscription_tier = ?
    `).bind(user.id, item_type, subscription_tier).first();
    
    if (existing) {
      return c.json({ 
        error: 'Item already in cart',
        message: 'This item is already in your shopping cart'
      }, 400);
    }
    
    // Add item to cart
    const result = await c.env.DB.prepare(`
      INSERT INTO shopping_cart (
        user_id, item_type, subscription_tier, price_usd, 
        duration_days, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      item_type,
      subscription_tier,
      price_usd,
      duration_days,
      description || null,
      
    ).run();
    
    return c.json({ 
      message: 'Item added to cart',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove item from cart
cart.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const itemId = c.req.param('id');
    
    // Check if item belongs to user
    const item = await c.env.DB.prepare(`
      SELECT id FROM shopping_cart 
      WHERE id = ? AND user_id = ?
    `).bind(itemId, user.id).first();
    
    if (!item) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    // Delete item
    await c.env.DB.prepare(`
      DELETE FROM shopping_cart WHERE id = ?
    `).bind(itemId).run();
    
    return c.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Clear all items from cart
cart.delete('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    await c.env.DB.prepare(`
      DELETE FROM shopping_cart WHERE user_id = ?
    `).bind(user.id).run();
    
    return c.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get cart total
cart.get('/total', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    const result = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as item_count,
        SUM(price_usd) as total_amount
      FROM shopping_cart 
      WHERE user_id = ?
    `).bind(user.id).first();
    
    return c.json({
      item_count: result?.item_count || 0,
      total_amount: result?.total_amount || 0
    });
  } catch (error) {
    console.error('Get cart total error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default cart;
