import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyToken } from '../utils/auth';

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Helper: Get user from token
// ============================================================================

async function getUserFromToken(c: any): Promise<any> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token, c.env.JWT_SECRET);
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, subscription_tier, is_admin FROM users WHERE id = ?'
    ).bind(decoded.id).first();
    
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }
    
    return user;
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid token' });
  }
}

// ============================================================================
// GET /api/marketplace/products - List all products (public)
// ============================================================================

app.get('/products', async (c) => {
  try {
    const category = c.req.query('category');
    const productType = c.req.query('type');
    const featured = c.req.query('featured');
    
    let query = `
      SELECT 
        id, product_type, name, name_en, description, description_en,
        price_usd, is_free, is_subscription, subscription_tier,
        credits_cost, features_json, category, tags, image_url,
        is_active, is_featured, sort_order, purchase_count,
        rating_avg, rating_count, created_at, updated_at
      FROM marketplace_products
      WHERE is_active = 1
    `;
    
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (productType) {
      query += ' AND product_type = ?';
      params.push(productType);
    }
    
    if (featured === 'true') {
      query += ' AND is_featured = 1';
    }
    
    query += ' ORDER BY is_featured DESC, sort_order ASC, created_at DESC';
    
    const products = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      products: products.results || []
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/products/all - List ALL products including inactive (Admin only)
// ============================================================================

app.get('/products/all', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const products = await c.env.DB.prepare(`
      SELECT * FROM marketplace_products
      ORDER BY created_at DESC
    `).all();
    
    return c.json({
      success: true,
      products: products.results || []
    });
  } catch (error: any) {
    console.error('Error fetching all products:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/products/:id - Get product details (public)
// ============================================================================

app.get('/products/:id', async (c) => {
  try {
    const productId = c.req.param('id');
    
    const product = await c.env.DB.prepare(`
      SELECT * FROM marketplace_products WHERE id = ?
    `).bind(productId).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    return c.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/marketplace/products - Create new product (Admin only)
// ============================================================================

app.post('/products', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.product_type) {
      return c.json({
        success: false,
        error: 'Name and product_type are required'
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO marketplace_products (
        product_type, name, name_en, description, description_en,
        price_usd, is_free, is_subscription, subscription_tier,
        credits_cost, features_json, category, tags, image_url,
        demo_url, is_active, is_featured, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.product_type,
      body.name,
      body.name_en || null,
      body.description || null,
      body.description_en || null,
      parseFloat(body.price_usd) || 0.0,
      body.is_free ? 1 : 0,
      body.is_subscription ? 1 : 0,
      body.subscription_tier || null,
      body.credits_cost || 0,
      body.features_json || null,
      body.category || null,
      body.tags || null,
      body.image_url || null,
      body.demo_url || null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      body.is_featured ? 1 : 0,
      body.sort_order || 0
    ).run();
    
    return c.json({
      success: true,
      product_id: result.meta.last_row_id,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/marketplace/products/:id - Update product (Admin only)
// ============================================================================

app.put('/products/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const productId = c.req.param('id');
    const body = await c.req.json();
    
    // Check if product exists
    const product = await c.env.DB.prepare(
      'SELECT id FROM marketplace_products WHERE id = ?'
    ).bind(productId).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    
    const fields = [
      'product_type', 'name', 'name_en', 'description', 'description_en',
      'price_usd', 'is_free', 'is_subscription', 'subscription_tier',
      'credits_cost', 'features_json', 'category', 'tags', 'image_url',
      'demo_url', 'is_active', 'is_featured', 'sort_order'
    ];
    
    fields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Convert boolean fields
        if (['is_free', 'is_subscription', 'is_active', 'is_featured'].includes(field)) {
          params.push(body[field] ? 1 : 0);
        } else if (field === 'price_usd') {
          params.push(parseFloat(body[field]) || 0.0);
        } else {
          params.push(body[field]);
        }
      }
    });
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(productId);
    
    await c.env.DB.prepare(
      `UPDATE marketplace_products SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();
    
    return c.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/marketplace/products/:id/toggle-status - Toggle product active status (Admin only)
// ============================================================================

app.post('/products/:id/toggle-status', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const productId = c.req.param('id');
    
    // Get current status
    const product: any = await c.env.DB.prepare(
      'SELECT is_active FROM marketplace_products WHERE id = ?'
    ).bind(productId).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    // Toggle status
    const newStatus = product.is_active === 1 ? 0 : 1;
    
    await c.env.DB.prepare(
      'UPDATE marketplace_products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newStatus, productId).run();
    
    return c.json({
      success: true,
      is_active: newStatus === 1,
      message: newStatus === 1 ? 'Product published' : 'Product unpublished'
    });
  } catch (error: any) {
    console.error('Error toggling product status:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/marketplace/products/:id - Delete product (Admin only)
// ============================================================================

app.delete('/products/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    if (!user.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    const productId = c.req.param('id');
    
    await c.env.DB.prepare(
      'DELETE FROM marketplace_products WHERE id = ?'
    ).bind(productId).run();
    
    return c.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/cart - Get user's shopping cart
// ============================================================================

app.get('/cart', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const cartItems = await c.env.DB.prepare(`
      SELECT 
        sc.id as cart_id,
        sc.quantity,
        sc.added_at,
        p.*
      FROM shopping_cart sc
      JOIN marketplace_products p ON sc.product_id = p.id
      WHERE sc.user_id = ?
      ORDER BY sc.added_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      cart_items: cartItems.results || []
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/marketplace/cart/add - Add product to cart
// ============================================================================

app.post('/cart/add', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const body = await c.req.json();
    
    const { product_id } = body;
    
    if (!product_id) {
      return c.json({ success: false, error: 'Product ID is required' }, 400);
    }
    
    // Check if product exists and is active
    const product = await c.env.DB.prepare(
      'SELECT id, is_active FROM marketplace_products WHERE id = ?'
    ).bind(product_id).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    if (!(product as any).is_active) {
      return c.json({ success: false, error: 'Product is not available' }, 400);
    }
    
    // Check if already purchased
    const existingPurchase = await c.env.DB.prepare(
      'SELECT id FROM user_purchases WHERE user_id = ? AND product_id = ?'
    ).bind(user.id, product_id).first();
    
    if (existingPurchase) {
      return c.json({ 
        success: false, 
        error: 'You have already purchased this product' 
      }, 400);
    }
    
    // Check if already in cart
    const existingCart = await c.env.DB.prepare(
      'SELECT id FROM shopping_cart WHERE user_id = ? AND product_id = ?'
    ).bind(user.id, product_id).first();
    
    if (existingCart) {
      return c.json({ 
        success: false, 
        error: 'Product is already in your cart' 
      }, 400);
    }
    
    // Add to cart
    await c.env.DB.prepare(`
      INSERT INTO shopping_cart (user_id, product_id, quantity)
      VALUES (?, ?, 1)
    `).bind(user.id, product_id).run();
    
    return c.json({
      success: true,
      message: 'Product added to cart'
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/marketplace/cart/:cartId - Remove item from cart
// ============================================================================

app.delete('/cart/:cartId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const cartId = c.req.param('cartId');
    
    await c.env.DB.prepare(
      'DELETE FROM shopping_cart WHERE id = ? AND user_id = ?'
    ).bind(cartId, user.id).run();
    
    return c.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error: any) {
    console.error('Error removing from cart:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/marketplace/checkout - Checkout and purchase all items in cart
// ============================================================================

app.post('/checkout', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    // Get all cart items with product details
    const cartItems: any = await c.env.DB.prepare(`
      SELECT 
        sc.id as cart_id,
        sc.product_id,
        p.product_type,
        p.name,
        p.price_usd
      FROM shopping_cart sc
      JOIN marketplace_products p ON sc.product_id = p.id
      WHERE sc.user_id = ? AND p.is_active = 1
    `).bind(user.id).all();
    
    if (!cartItems.results || cartItems.results.length === 0) {
      return c.json({ success: false, error: 'Cart is empty' }, 400);
    }
    
    // Create purchase records for each item
    const purchaseIds = [];
    
    for (const item of cartItems.results) {
      const result = await c.env.DB.prepare(`
        INSERT INTO user_purchases (
          user_id, product_id, product_type, product_name, price_paid, status
        ) VALUES (?, ?, ?, ?, ?, 'completed')
      `).bind(
        user.id,
        item.product_id,
        item.product_type,
        item.name,
        item.price_usd
      ).run();
      
      purchaseIds.push(result.meta.last_row_id);
      
      // Update product purchase count
      await c.env.DB.prepare(
        'UPDATE marketplace_products SET purchase_count = purchase_count + 1 WHERE id = ?'
      ).bind(item.product_id).run();
    }
    
    // Clear cart
    await c.env.DB.prepare(
      'DELETE FROM shopping_cart WHERE user_id = ?'
    ).bind(user.id).run();
    
    return c.json({
      success: true,
      purchase_count: purchaseIds.length,
      message: 'Purchase completed successfully'
    });
  } catch (error: any) {
    console.error('Error during checkout:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/my-purchases - Get user's purchased products
// ============================================================================

app.get('/my-purchases', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const purchases = await c.env.DB.prepare(`
      SELECT 
        up.*,
        p.description,
        p.image_url
      FROM user_purchases up
      LEFT JOIN marketplace_products p ON up.product_id = p.id
      WHERE up.user_id = ?
      ORDER BY up.purchase_date DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      purchases: purchases.results || []
    });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/my-agents - Get user's purchased AI agents
// ============================================================================

app.get('/my-agents', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const agents = await c.env.DB.prepare(`
      SELECT 
        up.*,
        p.description,
        p.image_url,
        p.features_json
      FROM user_purchases up
      JOIN marketplace_products p ON up.product_id = p.id
      WHERE up.user_id = ? AND up.product_type = 'ai_service'
      ORDER BY up.purchase_date DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      agents: agents.results || []
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
