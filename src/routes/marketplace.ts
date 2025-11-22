import { Hono } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware: optional for GET products, required for admin operations and cart
app.use('/products/all', authMiddleware, adminOnly);

// Cart and purchase operations require authentication
app.use('/cart/*', authMiddleware);
app.use('/checkout', authMiddleware);
app.use('/my-purchases', authMiddleware);
app.use('/my-agents', authMiddleware);

// Product mutations require admin role
app.use('/products/*', async (c, next) => {
  const method = c.req.method;
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return authMiddleware(c, async () => adminOnly(c, next));
  }
  await next();
});

app.use('/products', async (c, next) => {
  const method = c.req.method;
  if (method === 'POST') {
    return authMiddleware(c, async () => adminOnly(c, next));
  }
  await next();
});

// ============================================================================
// GET /api/marketplace/products - List all products (public)
// Includes marketplace products + paid writing templates
// ============================================================================

app.get('/products', async (c) => {
  try {
    const category = c.req.query('category');
    const productType = c.req.query('type');
    const featured = c.req.query('featured');
    
    // Get marketplace products
    let query = `
      SELECT 
        id, product_type, name, name_en, description, description_en,
        price_user, price_premium, price_super, is_free, is_subscription, subscription_tier,
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
    
    const marketplaceProducts = await c.env.DB.prepare(query).bind(...params).all();
    let products: any[] = marketplaceProducts.results || [];
    
    // Get public review templates and add them as products
    if (!category || category === 'review_template') {
      const templates = await c.env.DB.prepare(`
        SELECT 
          id,
          name,
          NULL as name_en,
          description,
          NULL as description_en,
          COALESCE(price_basic, price, 0) as price_user,
          COALESCE(price_premium, price, 0) as price_premium,
          COALESCE(price_super, price, 0) as price_super,
          0 as is_free,
          0 as is_subscription,
          NULL as subscription_tier,
          0 as credits_cost,
          NULL as features_json,
          'review_template' as category,
          'review_template' as product_type,
          NULL as tags,
          NULL as image_url,
          is_active,
          0 as is_featured,
          0 as sort_order,
          0 as purchase_count,
          0 as rating_avg,
          0 as rating_count,
          created_at,
          updated_at
        FROM templates
        WHERE owner = 'public' AND is_active = 1
        ORDER BY created_at DESC
      `).all();
      
      // Prefix template IDs with 't_' to distinguish from marketplace products
      const transformedTemplates = (templates.results || []).map((t: any) => ({
        ...t,
        id: `t_${t.id}`, // Prefix to distinguish from marketplace products
        source: 'review_template' // Mark the source
      }));
      
      products = [...products, ...transformedTemplates];
    }
    
    // Get public AI writing templates and add them as products
    if (!category || category === 'writing_template') {
      const writingTemplates = await c.env.DB.prepare(`
        SELECT 
          id,
          name,
          name_en,
          description,
          description_en,
          price_user,
          price_premium,
          price_super,
          0 as is_free,
          0 as is_subscription,
          NULL as subscription_tier,
          0 as credits_cost,
          NULL as features_json,
          'writing_template' as category,
          'writing_template' as product_type,
          tags,
          NULL as image_url,
          is_active,
          is_featured,
          sort_order,
          0 as purchase_count,
          0 as rating_avg,
          0 as rating_count,
          created_at,
          updated_at
        FROM ai_writing_templates
        WHERE is_public = 1 AND is_active = 1
        ORDER BY is_featured DESC, sort_order ASC, created_at DESC
      `).all();
      
      // Prefix template IDs with 'wt_' to distinguish from marketplace products
      const transformedWritingTemplates = (writingTemplates.results || []).map((t: any) => ({
        ...t,
        id: `wt_${t.id}`, // Prefix to distinguish from marketplace products
        source: 'writing_template' // Mark the source
      }));
      
      products = [...products, ...transformedWritingTemplates];
    }
    
    return c.json({
      success: true,
      products: products
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
    let product: any = null;
    
    // Check if it's a review template (t_XX)
    if (productId.startsWith('t_')) {
      const templateId = productId.substring(2); // Remove 't_' prefix
      product = await c.env.DB.prepare(`
        SELECT 
          id,
          name,
          NULL as name_en,
          description,
          NULL as description_en,
          COALESCE(price_basic, price, 0) as price_user,
          COALESCE(price_premium, price, 0) as price_premium,
          COALESCE(price_super, price, 0) as price_super,
          CASE WHEN COALESCE(price_basic, price, 0) = 0 THEN 1 ELSE 0 END as is_free,
          0 as is_subscription,
          NULL as subscription_tier,
          0 as credits_cost,
          NULL as features_json,
          'review_template' as category,
          'review_template' as product_type,
          NULL as tags,
          NULL as image_url,
          is_active,
          0 as is_featured,
          0 as sort_order,
          0 as purchase_count,
          0.0 as rating_avg,
          0 as rating_count,
          created_at,
          updated_at
        FROM templates
        WHERE id = ? AND owner = 'public' AND is_active = 1
      `).bind(templateId).first();
      
      // If found, prepend 't_' to the id
      if (product) {
        product.id = `t_${product.id}`;
      }
    }
    // Check if it's a writing template (wt_XX)
    else if (productId.startsWith('wt_')) {
      const templateId = productId.substring(3); // Remove 'wt_' prefix
      product = await c.env.DB.prepare(`
        SELECT 
          id,
          name,
          name_en,
          description,
          description_en,
          COALESCE(price_user, 0) as price_user,
          COALESCE(price_premium, 0) as price_premium,
          COALESCE(price_super, 0) as price_super,
          CASE WHEN COALESCE(price_user, 0) = 0 THEN 1 ELSE 0 END as is_free,
          0 as is_subscription,
          NULL as subscription_tier,
          0 as credits_cost,
          NULL as features_json,
          'writing_template' as category,
          'writing_template' as product_type,
          tags,
          NULL as image_url,
          is_active,
          is_featured,
          sort_order,
          usage_count as purchase_count,
          0.0 as rating_avg,
          0 as rating_count,
          created_at,
          updated_at
        FROM ai_writing_templates
        WHERE id = ? AND is_public = 1 AND is_active = 1
      `).bind(templateId).first();
      
      // If found, prepend 'wt_' to the id
      if (product) {
        product.id = `wt_${product.id}`;
      }
    }
    // Otherwise check marketplace_products table
    else {
      product = await c.env.DB.prepare(`
        SELECT * FROM marketplace_products WHERE id = ?
      `).bind(productId).first();
    }
    
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
    const user = c.get('user');
    
    
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
        price_user, price_premium, price_super, is_free, is_subscription, subscription_tier,
        credits_cost, features_json, category, tags, image_url,
        demo_url, agent_link, is_active, is_featured, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.product_type,
      body.name,
      body.name_en || null,
      body.description || null,
      body.description_en || null,
      parseFloat(body.price_user) || 0.0,
      parseFloat(body.price_premium) || 0.0,
      parseFloat(body.price_super) || 0.0,
      body.is_free ? 1 : 0,
      body.is_subscription ? 1 : 0,
      body.subscription_tier || null,
      body.credits_cost || 0,
      body.features_json || null,
      body.category || null,
      body.tags || null,
      body.image_url || null,
      body.demo_url || null,
      body.agent_link || null,
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
    const user = c.get('user');
    
    
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
      'price_user', 'price_premium', 'price_super', 'is_free', 'is_subscription', 'subscription_tier',
      'credits_cost', 'features_json', 'category', 'tags', 'image_url',
      'demo_url', 'agent_link', 'is_active', 'is_featured', 'sort_order'
    ];
    
    fields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Convert boolean fields
        if (['is_free', 'is_subscription', 'is_active', 'is_featured'].includes(field)) {
          params.push(body[field] ? 1 : 0);
        } else if (['price_user', 'price_premium', 'price_super'].includes(field)) {
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
    const user = c.get('user');
    
    
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
    const user = c.get('user');
    
    
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
    const user = c.get('user');
    
    // Get all cart items
    const cartItemsRaw = await c.env.DB.prepare(`
      SELECT 
        id as cart_id,
        product_id,
        quantity,
        added_at
      FROM shopping_cart
      WHERE user_id = ?
      ORDER BY added_at DESC
    `).bind(user.id).all();
    
    const items = cartItemsRaw.results || [];
    
    // Fetch product details for each item
    const cartItems = [];
    for (const item of items) {
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
          quantity: item.quantity,
          added_at: item.added_at,
          ...product
        });
      }
    }
    
    return c.json({
      success: true,
      cart_items: cartItems
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/marketplace/cart/add - Add product to cart
// ============================================================================

// POST /cart - Alias for /cart/add (for backward compatibility)
app.post('/cart', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    let { product_id } = body;
    
    if (!product_id) {
      return c.json({ success: false, error: 'Product ID is required' }, 400);
    }
    
    // Check if this is a writing template (prefix 'wt_') or review template (prefix 't_')
    const isWritingTemplate = typeof product_id === 'string' && product_id.startsWith('wt_');
    const isReviewTemplate = typeof product_id === 'string' && product_id.startsWith('t_');
    let actualProductId = product_id;
    let product: any = null;
    
    if (isWritingTemplate) {
      // Extract the real template ID (remove 'wt_' prefix)
      const templateId = parseInt(product_id.substring(3));
      
      // Check if writing template exists and is active
      product = await c.env.DB.prepare(
        'SELECT id, is_active, is_public FROM ai_writing_templates WHERE id = ?'
      ).bind(templateId).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Writing template not found' }, 404);
      }
      
      if (!product.is_active || !product.is_public) {
        return c.json({ success: false, error: 'Writing template is not available' }, 400);
      }
      
      // Keep the original product_id with prefix for cart storage
      actualProductId = product_id;
    } else if (isReviewTemplate) {
      // Extract the real template ID (remove 't_' prefix)
      const templateId = parseInt(product_id.substring(2));
      
      // Check if review template exists and is active
      product = await c.env.DB.prepare(
        'SELECT id, is_active, price FROM templates WHERE id = ?'
      ).bind(templateId).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Template not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Template is not available' }, 400);
      }
      
      if (product.price <= 0) {
        return c.json({ success: false, error: 'This template is free' }, 400);
      }
      
      // Keep the original product_id with prefix for cart storage
      actualProductId = product_id;
    } else {
      // Regular marketplace product
      product = await c.env.DB.prepare(
        'SELECT id, is_active FROM marketplace_products WHERE id = ?'
      ).bind(product_id).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Product not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Product is not available' }, 400);
      }
      
      // Convert numeric product_id to string for consistent storage
      actualProductId = String(product_id);
    }
    
    // Check if already purchased
    const existingPurchase = await c.env.DB.prepare(
      'SELECT id FROM user_purchases WHERE user_id = ? AND product_id = ?'
    ).bind(user.id, actualProductId).first();
    
    if (existingPurchase) {
      return c.json({ 
        success: false, 
        error: 'You have already purchased this product' 
      }, 400);
    }
    
    // Check if already in cart
    const existingCart = await c.env.DB.prepare(
      'SELECT id FROM shopping_cart WHERE user_id = ? AND product_id = ?'
    ).bind(user.id, actualProductId).first();
    
    if (existingCart) {
      return c.json({ 
        success: false, 
        error: 'Product is already in your cart' 
      }, 400);
    }
    
    // Add to cart (store with prefix if template)
    await c.env.DB.prepare(`
      INSERT INTO shopping_cart (user_id, product_id, quantity)
      VALUES (?, ?, 1)
    `).bind(user.id, actualProductId).run();
    
    return c.json({
      success: true,
      message: 'Product added to cart'
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/cart/add', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    let { product_id } = body;
    
    if (!product_id) {
      return c.json({ success: false, error: 'Product ID is required' }, 400);
    }
    
    // Check if this is a writing template (prefix 'wt_') or review template (prefix 't_')
    const isWritingTemplate = typeof product_id === 'string' && product_id.startsWith('wt_');
    const isReviewTemplate = typeof product_id === 'string' && product_id.startsWith('t_');
    let actualProductId = product_id;
    let product: any = null;
    
    if (isWritingTemplate) {
      // Extract the real template ID (remove 'wt_' prefix)
      const templateId = parseInt(product_id.substring(3));
      
      // Check if writing template exists and is active
      product = await c.env.DB.prepare(
        'SELECT id, is_active, price_user FROM ai_writing_templates WHERE id = ?'
      ).bind(templateId).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Template not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Template is not available' }, 400);
      }
      
      if (product.price_user <= 0) {
        return c.json({ success: false, error: 'This template is free' }, 400);
      }
      
      // Keep the original product_id with prefix for cart storage
      actualProductId = product_id;
    } else if (isReviewTemplate) {
      // Extract the real template ID (remove 't_' prefix)
      const templateId = parseInt(product_id.substring(2));
      
      // Check if review template exists and is active
      product = await c.env.DB.prepare(
        'SELECT id, is_active, price FROM templates WHERE id = ?'
      ).bind(templateId).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Template not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Template is not available' }, 400);
      }
      
      if (product.price <= 0) {
        return c.json({ success: false, error: 'This template is free' }, 400);
      }
      
      // Keep the original product_id with prefix for cart storage
      actualProductId = product_id;
    } else {
      // Regular marketplace product
      product = await c.env.DB.prepare(
        'SELECT id, is_active FROM marketplace_products WHERE id = ?'
      ).bind(product_id).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Product not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Product is not available' }, 400);
      }
      
      // Convert numeric product_id to string for consistent storage
      actualProductId = String(product_id);
    }
    
    // Check if already purchased
    const existingPurchase = await c.env.DB.prepare(
      'SELECT id FROM user_purchases WHERE user_id = ? AND product_id = ?'
    ).bind(user.id, actualProductId).first();
    
    if (existingPurchase) {
      return c.json({ 
        success: false, 
        error: 'You have already purchased this product' 
      }, 400);
    }
    
    // Check if already in cart
    const existingCart = await c.env.DB.prepare(
      'SELECT id FROM shopping_cart WHERE user_id = ? AND product_id = ?'
    ).bind(user.id, actualProductId).first();
    
    if (existingCart) {
      return c.json({ 
        success: false, 
        error: 'Product is already in your cart' 
      }, 400);
    }
    
    // Add to cart (store with prefix if template)
    await c.env.DB.prepare(`
      INSERT INTO shopping_cart (user_id, product_id, quantity)
      VALUES (?, ?, 1)
    `).bind(user.id, actualProductId).run();
    
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
    const user = c.get('user');
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
    const user = c.get('user');
    
    // Validate user is properly authenticated
    if (!user || !user.id) {
      console.error('Checkout error: User not authenticated', { user });
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }
    
    console.log('Checkout initiated by user:', user.id, user.email);
    
    // Get user email for buyer tracking
    const userInfo: any = await c.env.DB.prepare(
      'SELECT email FROM users WHERE id = ?'
    ).bind(user.id).first();
    
    if (!userInfo) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    // Get all cart items (raw product_ids)
    const cartItemsRaw: any = await c.env.DB.prepare(`
      SELECT id as cart_id, product_id
      FROM shopping_cart
      WHERE user_id = ?
    `).bind(user.id).all();
    
    console.log('Cart items found:', cartItemsRaw.results?.length || 0);
    
    if (!cartItemsRaw.results || cartItemsRaw.results.length === 0) {
      return c.json({ success: false, error: 'Cart is empty' }, 400);
    }
    
    // Fetch product details for each cart item
    const cartItems = [];
    for (const cartItem of cartItemsRaw.results) {
      const productId = cartItem.product_id;
      console.log('Processing cart item:', productId);
      let product: any = null;
      
      // Check if writing template (wt_)
      if (typeof productId === 'string' && productId.startsWith('wt_')) {
        const templateId = parseInt(productId.substring(3));
        product = await c.env.DB.prepare(`
          SELECT 
            id,
            name,
            price_user,
            price_premium,
            price_super,
            'writing_template' as product_type,
            is_active
          FROM ai_writing_templates
          WHERE id = ?
        `).bind(templateId).first();
        
        if (product) {
          product.id = productId; // Keep prefixed ID
        }
      } 
      // Check if review template (t_)
      else if (typeof productId === 'string' && productId.startsWith('t_')) {
        const templateId = parseInt(productId.substring(2));
        product = await c.env.DB.prepare(`
          SELECT 
            id,
            name,
            COALESCE(price_basic, price, 0) as price_user,
            COALESCE(price_premium, price, 0) as price_premium,
            COALESCE(price_super, price, 0) as price_super,
            'review_template' as product_type,
            is_active
          FROM templates
          WHERE id = ?
        `).bind(templateId).first();
        
        if (product) {
          product.id = productId; // Keep prefixed ID
        }
      }
      // Regular marketplace product
      else {
        product = await c.env.DB.prepare(`
          SELECT 
            id,
            name,
            price_user,
            price_premium,
            price_super,
            product_type,
            is_active
          FROM marketplace_products
          WHERE id = ?
        `).bind(productId).first();
      }
      
      // Only add active products
      if (product && product.is_active) {
        console.log('Added product to cart items:', productId, product.name);
        cartItems.push({
          cart_id: cartItem.cart_id,
          product_id: productId,
          ...product
        });
      } else {
        console.warn('Product not found or inactive:', productId);
      }
    }
    
    console.log('Final cart items count:', cartItems.length);
    
    if (cartItems.length === 0) {
      return c.json({ success: false, error: 'No active products in cart' }, 400);
    }
    
    // Create purchase records for each item
    const purchaseIds = [];
    
    for (const item of cartItems) {
      console.log('Creating purchase for item:', item.product_id, item.name);
      
      // Determine price based on user's subscription tier
      let priceToPay = parseFloat(item.price_user) || 0;
      if (user.subscription_tier === 'super') {
        priceToPay = parseFloat(item.price_super) || parseFloat(item.price_user) || 0;
      } else if (user.subscription_tier === 'premium') {
        priceToPay = parseFloat(item.price_premium) || parseFloat(item.price_user) || 0;
      }
      
      console.log('Price to pay:', priceToPay, 'for tier:', user.subscription_tier || 'user');
      
      try {
        const result = await c.env.DB.prepare(`
          INSERT INTO user_purchases (
            user_id, product_id, product_type, product_name, price_paid, status
          ) VALUES (?, ?, ?, ?, ?, 'completed')
        `).bind(
          user.id,
          item.product_id,
          item.product_type,
          item.name,
          priceToPay
        ).run();
        
        console.log('Purchase created successfully, ID:', result.meta.last_row_id);
        purchaseIds.push(result.meta.last_row_id);
      } catch (dbError: any) {
        console.error('Database error creating purchase:', dbError);
        throw new Error(`Failed to create purchase for ${item.name}: ${dbError.message}`);
      }
      
      // Update product purchase count (only for marketplace products)
      if (!item.product_id.toString().startsWith('wt_') && !item.product_id.toString().startsWith('t_')) {
        await c.env.DB.prepare(
          'UPDATE marketplace_products SET purchase_count = purchase_count + 1 WHERE id = ?'
        ).bind(item.product_id).run();
      }
      
      // Add buyer to appropriate buyers table based on product type
      if (item.product_type === 'review_template') {
        // Extract template ID from product_id (format: 't_123')
        const templateId = parseInt(item.product_id.toString().replace(/^t_/, ''));
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO template_buyers (template_id, user_email, purchase_price)
          VALUES (?, ?, ?)
        `).bind(templateId, userInfo.email, priceToPay).run();
      } else if (item.product_type === 'writing_template') {
        // Extract writing template ID from product_id (format: 'wt_123')
        const templateId = parseInt(item.product_id.toString().replace(/^wt_/, ''));
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO writing_template_buyers (template_id, user_email, purchase_price)
          VALUES (?, ?, ?)
        `).bind(templateId, userInfo.email, priceToPay).run();
      } else if (item.product_type === 'ai_service') {
        // For ai_service (智能体), use product_buyers table
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO product_buyers (product_id, user_email, purchase_price)
          VALUES (?, ?, ?)
        `).bind(item.product_id, userInfo.email, priceToPay).run();
      } else {
        // For other product types, use product_buyers table
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO product_buyers (product_id, user_email, purchase_price)
          VALUES (?, ?, ?)
        `).bind(item.product_id, userInfo.email, priceToPay).run();
      }
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
    console.error('Error stack:', error.stack);
    return c.json({ 
      success: false, 
      error: error.message || 'Checkout failed',
      details: error.stack?.split('\n')[0] // First line of stack trace
    }, 500);
  }
});

// ============================================================================
// GET /api/marketplace/my-purchases - Get user's purchased products
// ============================================================================

app.get('/my-purchases', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.id) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get all purchases excluding ai_service (智能体显示在单独页面)
    const purchasesRaw = await c.env.DB.prepare(`
      SELECT 
        id,
        user_id,
        product_id,
        product_type,
        product_name,
        price_paid,
        status,
        purchase_date
      FROM user_purchases
      WHERE user_id = ? AND (product_type IS NULL OR product_type != 'ai_service')
      ORDER BY purchase_date DESC
    `).bind(user.id).all();
    
    const items = purchasesRaw.results || [];
    
    // Fetch additional details for each purchase
    const purchases = [];
    for (const item of items) {
      const productId = item.product_id;
      let description = '';
      let image_url = null;
      
      // Check if this is a writing template (prefix 'wt_')
      if (typeof productId === 'string' && productId.startsWith('wt_')) {
        const templateId = parseInt(productId.substring(3));
        const template: any = await c.env.DB.prepare(`
          SELECT description, NULL as image_url
          FROM ai_writing_templates
          WHERE id = ?
        `).bind(templateId).first();
        
        if (template) {
          description = template.description || '';
          image_url = template.image_url;
        }
      } else if (typeof productId === 'string' && productId.startsWith('t_')) {
        // Check if this is a review template (prefix 't_')
        const templateId = parseInt(productId.substring(2));
        const template: any = await c.env.DB.prepare(`
          SELECT description, NULL as image_url
          FROM templates
          WHERE id = ?
        `).bind(templateId).first();
        
        if (template) {
          description = template.description || '';
          image_url = template.image_url;
        }
      } else if (productId) {
        // Regular marketplace product
        const product: any = await c.env.DB.prepare(`
          SELECT description, image_url
          FROM marketplace_products
          WHERE id = ?
        `).bind(productId).first();
        
        if (product) {
          description = product.description || '';
          image_url = product.image_url;
        }
      }
      
      purchases.push({
        ...item,
        description,
        image_url,
        // Ensure product_type is set
        product_type: item.product_type || 'other'
      });
    }
    
    return c.json({
      success: true,
      purchases: purchases
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
    const user = c.get('user');
    
    // Get all AI service purchases
    const purchasesRaw = await c.env.DB.prepare(`
      SELECT 
        id,
        user_id,
        product_id,
        product_type,
        product_name,
        price_paid,
        status,
        purchase_date
      FROM user_purchases
      WHERE user_id = ? AND product_type = 'ai_service'
      ORDER BY purchase_date DESC
    `).bind(user.id).all();
    
    const items = purchasesRaw.results || [];
    
    // Fetch additional details for each purchase
    const agents = [];
    for (const item of items) {
      const productId = item.product_id;
      let description = '';
      let image_url = null;
      let features_json = null;
      
      // Query marketplace_products for details
      // Convert productId to integer for marketplace_products query
      const numericProductId = parseInt(productId.toString());
      const product: any = await c.env.DB.prepare(`
        SELECT description, image_url, features_json, agent_link
        FROM marketplace_products
        WHERE id = ?
      `).bind(numericProductId).first();
      
      if (product) {
        description = product.description || '';
        image_url = product.image_url;
        features_json = product.features_json;
      }
      
      agents.push({
        ...item,
        description,
        image_url,
        features_json,
        agent_link: product?.agent_link || null
      });
    }
    
    return c.json({
      success: true,
      agents: agents
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
