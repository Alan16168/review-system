import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Helper: Get user from token (simplified for now)
// ============================================================================

async function getUserFromToken(c: any): Promise<any> {
  // Get token from header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // TEMPORARY: Use default user for testing
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, subscription_tier, is_admin FROM users WHERE id = ?'
    ).bind(1).first();
    return user;
  }

  const token = authHeader.substring(7);
  
  try {
    // TODO: Implement proper JWT verification
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, subscription_tier, is_admin FROM users WHERE id = ?'
    ).bind(1).first();
    
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }
    
    return user;
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid token' });
  }
}

// ============================================================================
// GET /api/marketplace/products - List all products
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
// GET /api/marketplace/products/:id - Get product details
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
      body.price_usd || 0.0,
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
// GET /api/marketplace/my-purchases - Get user's purchased products
// ============================================================================

app.get('/my-purchases', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const purchases = await c.env.DB.prepare(`
      SELECT 
        mp.id as purchase_id,
        mp.purchase_type,
        mp.amount_usd,
        mp.payment_status,
        mp.subscription_start,
        mp.subscription_end,
        mp.purchased_at,
        p.*
      FROM marketplace_purchases mp
      JOIN marketplace_products p ON mp.product_id = p.id
      WHERE mp.user_id = ?
      ORDER BY mp.purchased_at DESC
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
// POST /api/marketplace/purchase - Purchase a product
// ============================================================================

app.post('/purchase', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const body = await c.req.json();
    
    const { product_id, payment_method = 'paypal' } = body;
    
    if (!product_id) {
      return c.json({ success: false, error: 'Product ID is required' }, 400);
    }
    
    // Get product details
    const product: any = await c.env.DB.prepare(
      'SELECT * FROM marketplace_products WHERE id = ? AND is_active = 1'
    ).bind(product_id).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found or inactive' }, 404);
    }
    
    // Check if already purchased (for one-time products)
    if (!product.is_subscription) {
      const existingPurchase = await c.env.DB.prepare(
        'SELECT id FROM marketplace_purchases WHERE user_id = ? AND product_id = ?'
      ).bind(user.id, product_id).first();
      
      if (existingPurchase) {
        return c.json({ 
          success: false, 
          error: 'You have already purchased this product' 
        }, 400);
      }
    }
    
    // Determine purchase type and amount
    let purchaseType = 'one_time';
    let amountUsd = product.price_usd || 0;
    let subscriptionStart = null;
    let subscriptionEnd = null;
    
    if (product.is_subscription) {
      purchaseType = 'subscription';
      subscriptionStart = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
      subscriptionEnd = endDate.toISOString().split('T')[0];
    }
    
    if (product.is_free) {
      amountUsd = 0;
    }
    
    // Create purchase record
    const result = await c.env.DB.prepare(`
      INSERT INTO marketplace_purchases (
        user_id, product_id, purchase_type, amount_usd,
        payment_method, payment_status,
        subscription_start, subscription_end, auto_renew
      ) VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, 0)
    `).bind(
      user.id,
      product_id,
      purchaseType,
      amountUsd,
      payment_method,
      subscriptionStart,
      subscriptionEnd
    ).run();
    
    // Update product purchase count
    await c.env.DB.prepare(
      'UPDATE marketplace_products SET purchase_count = purchase_count + 1 WHERE id = ?'
    ).bind(product_id).run();
    
    // If subscription, update user's subscription tier
    if (product.is_subscription && product.subscription_tier) {
      await c.env.DB.prepare(
        'UPDATE users SET subscription_tier = ?, subscription_expires = ? WHERE id = ?'
      ).bind(product.subscription_tier, subscriptionEnd, user.id).run();
    }
    
    return c.json({
      success: true,
      purchase_id: result.meta.last_row_id,
      message: 'Purchase completed successfully'
    });
  } catch (error: any) {
    console.error('Error processing purchase:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/check-access/:productId - Check if user has access
// ============================================================================

app.get('/check-access/:productId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const productId = c.req.param('productId');
    
    // Check if user has purchased this product
    const purchase: any = await c.env.DB.prepare(`
      SELECT 
        mp.*,
        p.is_subscription,
        p.product_type
      FROM marketplace_purchases mp
      JOIN marketplace_products p ON mp.product_id = p.id
      WHERE mp.user_id = ? AND mp.product_id = ?
      ORDER BY mp.purchased_at DESC
      LIMIT 1
    `).bind(user.id, productId).first();
    
    if (!purchase) {
      return c.json({
        success: true,
        has_access: false,
        message: 'Product not purchased'
      });
    }
    
    // Check if subscription is still valid
    if (purchase.is_subscription && purchase.subscription_end) {
      const endDate = new Date(purchase.subscription_end);
      const now = new Date();
      
      if (now > endDate) {
        return c.json({
          success: true,
          has_access: false,
          message: 'Subscription expired',
          expired_at: purchase.subscription_end
        });
      }
    }
    
    return c.json({
      success: true,
      has_access: true,
      purchase_info: {
        purchased_at: purchase.purchased_at,
        subscription_end: purchase.subscription_end
      }
    });
  } catch (error: any) {
    console.error('Error checking access:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
