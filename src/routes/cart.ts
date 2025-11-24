import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { UserPayload } from '../utils/auth';

type Bindings = {
  DB: D1Database;
};

const cart = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
cart.use('/*', authMiddleware);

// Get user's cart items (unified cart for subscriptions and products)
cart.get('/', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available in c.env');
      console.error('Available env keys:', Object.keys(c.env));
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing. Please configure it in Cloudflare Pages settings.',
        help: 'Go to Cloudflare Dashboard > Workers & Pages > review-system > Settings > Functions > D1 database bindings'
      }, 500);
    }
    
    const user = c.get('user') as UserPayload;
    console.log('📦 Getting unified cart for user:', user.id);
    
    const cartItemsRaw = await c.env.DB.prepare(`
      SELECT 
        id as cart_id,
        item_type,
        product_id,
        quantity,
        subscription_tier,
        price_usd,
        duration_days,
        description,
        description_en,
        added_at
      FROM shopping_cart 
      WHERE user_id = ?
      ORDER BY added_at DESC
    `).bind(user.id).all();
    
    const items = cartItemsRaw.results || [];
    console.log('✅ Raw cart items retrieved:', items.length);
    
    // Process each item to fetch product details if needed
    const cartItems = [];
    for (const item of items) {
      if (item.item_type === 'subscription') {
        // Subscription item - already has all data
        cartItems.push({
          cart_id: item.cart_id,
          item_type: 'subscription',
          id: `sub_${item.subscription_tier}`,
          product_type: 'subscription',
          category: 'subscription',
          name: item.description || `${item.subscription_tier === 'premium' ? '高级' : '超级'}会员年费`,
          name_en: item.description_en || `${item.subscription_tier === 'premium' ? 'Premium' : 'Super'} Member - Annual`,
          description: item.description,
          description_en: item.description_en,
          subscription_tier: item.subscription_tier,
          price_user: item.price_usd,
          price_premium: item.price_usd,
          price_super: item.price_usd,
          duration_days: item.duration_days,
          quantity: 1,
          is_active: true,
          added_at: item.added_at
        });
      } else {
        // Product item - fetch details from products tables
        const productId = item.product_id as string;
        let product: any = null;
        
        // Check if this is a writing template (prefix 'wt_')
        if (typeof productId === 'string' && productId.startsWith('wt_')) {
          const templateId = parseInt(productId.substring(3));
          product = await c.env.DB.prepare(`
            SELECT 
              id,
              name,
              description,
              price_user,
              price_premium,
              price_super,
              'writing_template' as product_type,
              'writing_template' as category,
              is_active
            FROM ai_writing_templates
            WHERE id = ?
          `).bind(templateId).first();
          
          if (product) {
            product.id = productId; // Keep the prefixed ID
          }
        } else if (typeof productId === 'string' && productId.startsWith('t_')) {
          // Check if this is a review template (prefix 't_')
          const templateId = parseInt(productId.substring(2));
          product = await c.env.DB.prepare(`
            SELECT 
              id,
              name,
              description,
              COALESCE(price_basic, price, 0) as price_user,
              COALESCE(price_premium, price, 0) as price_premium,
              COALESCE(price_super, price, 0) as price_super,
              'review_template' as product_type,
              'review_template' as category,
              is_active
            FROM templates
            WHERE id = ?
          `).bind(templateId).first();
          
          if (product) {
            product.id = productId; // Keep the prefixed ID
          }
        } else {
          // Regular marketplace product
          product = await c.env.DB.prepare(`
            SELECT * FROM marketplace_products WHERE id = ?
          `).bind(productId).first();
        }
        
        if (product) {
          cartItems.push({
            cart_id: item.cart_id,
            item_type: 'product',
            quantity: item.quantity || 1,
            added_at: item.added_at,
            ...product
          });
        }
      }
    }
    
    console.log('✅ Processed cart items:', cartItems.length);
    
    // Return in the format expected by frontend (cart_items field)
    return c.json({ 
      success: true,
      cart_items: cartItems,
      items: cartItems, // Also include 'items' for backward compatibility
      count: cartItems.length
    });
  } catch (error) {
    console.error('❌ Get cart error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return c.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Add item to cart (support both / and /add endpoints)
const addToCartHandler = async (c: any) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available in c.env');
      console.error('Available env keys:', Object.keys(c.env));
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing. Please configure it in Cloudflare Pages settings.'
      }, 500);
    }
    
    const user = c.get('user') as UserPayload;
    if (!user || !user.id) {
      console.error('❌ User not found in context');
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    console.log('✅ User authenticated:', { userId: user.id, email: user.email });
    
    const body = await c.req.json();
    console.log('📦 Request body:', body);
    
    // Support both old format (subscription_tier) and new format (item_id)
    const subscription_tier = body.subscription_tier || body.item_id;
    const item_type = body.item_type || 'subscription';
    const price_usd = body.price_usd;
    const item_name = body.item_name;
    
    // Validate required fields
    if (!subscription_tier || !price_usd) {
      console.error('❌ Missing required fields:', { 
        subscription_tier, 
        price_usd,
        body_received: body,
        item_id: body.item_id,
        subscription_tier_field: body.subscription_tier
      });
      return c.json({ 
        error: 'Missing required fields: item_id/subscription_tier and price_usd',
        received: { subscription_tier, price_usd, body }
      }, 400);
    }
    
    console.log('✅ Fields validated:', { subscription_tier, item_type, price_usd, item_name });
    
    // Get subscription config for duration
    let duration_days = 365;
    let description = item_name || (subscription_tier === 'premium' ? '高级会员年费' : '超级会员年费');
    let description_en = subscription_tier === 'premium' ? 'Premium Member - Annual' : 'Super Member - Annual';
    
    try {
      console.log('🔍 Fetching subscription config for tier:', subscription_tier);
      const config = await c.env.DB.prepare(
        'SELECT duration_days, description, description_en FROM subscription_config WHERE tier = ? AND is_active = 1'
      ).bind(subscription_tier).first();
      
      if (config) {
        duration_days = config.duration_days || 365;
        description = config.description || description;
        description_en = config.description_en || description_en;
        console.log('✅ Subscription config found:', config);
      } else {
        console.log('⚠️ No subscription config found, using defaults');
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch subscription config:', e);
    }
    
    // Check if item already exists in cart (prevent duplicates)
    console.log('🔍 Checking for existing cart item...');
    const existing = await c.env.DB.prepare(`
      SELECT id FROM shopping_cart 
      WHERE user_id = ? AND subscription_tier = ?
    `).bind(user.id, subscription_tier).first();
    
    if (existing) {
      console.log('⚠️ Item already in cart:', existing);
      return c.json({ 
        error: 'Item already in cart',
        message: '该商品已在购物车中'
      }, 400);
    }
    
    console.log('✅ No duplicate found, adding to cart...');
    
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
    
    console.log('✅ Item added to cart:', result);
    
    // Get updated cart count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM shopping_cart WHERE user_id = ?'
    ).bind(user.id).first();
    
    console.log('✅ Cart count updated:', countResult);
    
    return c.json({ 
      success: true,
      message: '已加入购物车',
      cart_id: result.meta.last_row_id,
      item_count: countResult?.count || 1
    }, 201);
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
};

cart.post('/', addToCartHandler);
cart.post('/add', addToCartHandler);

// Remove item from cart
cart.delete('/:id', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing. Please configure it in Cloudflare Pages settings.'
      }, 500);
    }
    
    const user = c.get('user') as UserPayload;
    const itemId = c.req.param('id');
    
    console.log('🗑️ Removing cart item:', { itemId, userId: user.id });
    
    // Check if item belongs to user
    const item = await c.env.DB.prepare(`
      SELECT id FROM shopping_cart 
      WHERE id = ? AND user_id = ?
    `).bind(itemId, user.id).first();
    
    if (!item) {
      console.log('⚠️ Item not found or access denied');
      return c.json({ error: 'Item not found' }, 404);
    }
    
    // Delete item
    await c.env.DB.prepare(`
      DELETE FROM shopping_cart WHERE id = ?
    `).bind(itemId).run();
    
    console.log('✅ Item removed from cart');
    
    return c.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Clear all items from cart
cart.delete('/', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing. Please configure it in Cloudflare Pages settings.'
      }, 500);
    }
    
    const user = c.get('user') as UserPayload;
    
    console.log('🗑️ Clearing cart for user:', user.id);
    
    await c.env.DB.prepare(`
      DELETE FROM shopping_cart WHERE user_id = ?
    `).bind(user.id).run();
    
    console.log('✅ Cart cleared');
    
    return c.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('❌ Clear cart error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get cart total
cart.get('/total', async (c) => {
  try {
    // Check if DB binding exists
    if (!c.env.DB) {
      console.error('❌ DB binding is not available');
      return c.json({ 
        error: 'Database not configured',
        details: 'D1 database binding is missing. Please configure it in Cloudflare Pages settings.'
      }, 500);
    }
    
    const user = c.get('user') as UserPayload;
    
    console.log('💰 Getting cart total for user:', user.id);
    
    const result = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as item_count,
        SUM(price_usd) as total_amount
      FROM shopping_cart 
      WHERE user_id = ?
    `).bind(user.id).first();
    
    console.log('✅ Cart total retrieved:', result);
    
    return c.json({
      item_count: result?.item_count || 0,
      total_amount: result?.total_amount || 0
    });
  } catch (error) {
    console.error('❌ Get cart total error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default cart;
