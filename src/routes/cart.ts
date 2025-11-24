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

// Add item to cart (support both / and /add endpoints)
const addToCartHandler = async (c: any) => {
  try {
    const user = c.get('user') as UserPayload;
    const body = await c.req.json();
    
    // Support both old format (subscription_tier) and new format (item_id)
    const subscription_tier = body.subscription_tier || body.item_id;
    const item_type = body.item_type || 'subscription';
    const price_usd = body.price_usd;
    const item_name = body.item_name;
    
    // Validate required fields
    if (!subscription_tier || !price_usd) {
      return c.json({ error: 'Missing required fields: item_id/subscription_tier and price_usd' }, 400);
    }
    
    // Get subscription config for duration
    let duration_days = 365;
    let description = item_name || (subscription_tier === 'premium' ? '高级会员年费' : '超级会员年费');
    let description_en = subscription_tier === 'premium' ? 'Premium Member - Annual' : 'Super Member - Annual';
    
    try {
      const config = await c.env.DB.prepare(
        'SELECT duration_days, description, description_en FROM subscription_config WHERE tier = ? AND is_active = 1'
      ).bind(subscription_tier).first();
      
      if (config) {
        duration_days = config.duration_days || 365;
        description = config.description || description;
        description_en = config.description_en || description_en;
      }
    } catch (e) {
      console.warn('Could not fetch subscription config:', e);
    }
    
    // Check if item already exists in cart (prevent duplicates)
    const existing = await c.env.DB.prepare(`
      SELECT id FROM shopping_cart 
      WHERE user_id = ? AND subscription_tier = ?
    `).bind(user.id, subscription_tier).first();
    
    if (existing) {
      return c.json({ 
        error: 'Item already in cart',
        message: '该商品已在购物车中'
      }, 400);
    }
    
    // Add item to cart
    const result = await c.env.DB.prepare(`
      INSERT INTO shopping_cart (
        user_id, item_type, subscription_tier, price_usd, 
        duration_days, description, description_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      item_type,
      subscription_tier,
      price_usd,
      duration_days,
      description,
      description_en
    ).run();
    
    // Get updated cart count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM shopping_cart WHERE user_id = ?'
    ).bind(user.id).first();
    
    return c.json({ 
      success: true,
      message: '已加入购物车',
      cart_id: result.meta.last_row_id,
      item_count: countResult?.count || 1
    }, 201);
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

cart.post('/', addToCartHandler);
cart.post('/add', addToCartHandler);

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
