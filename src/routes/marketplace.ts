import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================
// HELPER: Get user from JWT token
// ============================================================
async function getUserFromToken(c: any): Promise<any> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.substring(7);
  
  // Decode JWT token (simple base64 decode for demo, use proper JWT library in production)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId || payload.id;
    
    // Get user from database
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, subscription_tier FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// ============================================================
// HELPER: Get user credits balance
// ============================================================
async function getUserCredits(db: D1Database, userId: number): Promise<number> {
  const credits = await db.prepare(
    'SELECT balance FROM user_credits WHERE user_id = ?'
  ).bind(userId).first<{ balance: number }>();
  
  return credits?.balance || 0;
}

// ============================================================
// HELPER: Deduct credits
// ============================================================
async function deductCredits(
  db: D1Database, 
  userId: number, 
  amount: number, 
  description: string,
  relatedId?: number,
  relatedType?: string
): Promise<void> {
  // Get current balance
  const currentBalance = await getUserCredits(db, userId);
  
  if (currentBalance < amount) {
    throw new Error(`Insufficient credits. Current balance: ${currentBalance}, Required: ${amount}`);
  }
  
  const newBalance = currentBalance - amount;
  
  // Update balance
  await db.prepare(
    'UPDATE user_credits SET balance = ?, total_used = total_used + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
  ).bind(newBalance, amount, userId).run();
  
  // Record transaction
  await db.prepare(`
    INSERT INTO credit_transactions (
      user_id, transaction_type, amount, balance_after, 
      description, related_id, related_type, created_at
    ) VALUES (?, 'usage', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(userId, -amount, newBalance, description, relatedId || null, relatedType || null).run();
}

// ============================================================
// HELPER: Add credits
// ============================================================
async function addCredits(
  db: D1Database,
  userId: number,
  amount: number,
  transactionType: 'purchase' | 'bonus' | 'refund' | 'subscription_grant',
  description: string,
  relatedId?: number,
  relatedType?: string
): Promise<void> {
  // Initialize credits record if not exists
  await db.prepare(`
    INSERT OR IGNORE INTO user_credits (user_id, balance, total_purchased, total_used)
    VALUES (?, 0, 0, 0)
  `).bind(userId).run();
  
  // Get current balance
  const currentBalance = await getUserCredits(db, userId);
  const newBalance = currentBalance + amount;
  
  // Update balance
  await db.prepare(
    'UPDATE user_credits SET balance = ?, total_purchased = total_purchased + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
  ).bind(newBalance, amount, userId).run();
  
  // Record transaction
  await db.prepare(`
    INSERT INTO credit_transactions (
      user_id, transaction_type, amount, balance_after,
      description, related_id, related_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(userId, transactionType, amount, newBalance, description, relatedId || null, relatedType || null).run();
}

// ============================================================
// HELPER: Check subscription feature limits
// ============================================================
async function checkFeatureLimit(
  db: D1Database,
  userId: number,
  tier: string,
  featureKey: string
): Promise<{ allowed: boolean; limit: string; current: number }> {
  // Get feature limit for tier
  const feature = await db.prepare(
    'SELECT feature_value FROM subscription_features WHERE tier = ? AND feature_key = ?'
  ).bind(tier, featureKey).first<{ feature_value: string }>();
  
  if (!feature) {
    return { allowed: true, limit: 'unlimited', current: 0 };
  }
  
  const limit = feature.feature_value;
  
  // If unlimited, always allow
  if (limit === 'unlimited') {
    return { allowed: true, limit: 'unlimited', current: 0 };
  }
  
  // Get current usage
  const usage = await db.prepare(
    'SELECT usage_count FROM subscription_usage WHERE user_id = ? AND feature_key = ? AND period_start >= date("now", "start of month")'
  ).bind(userId, featureKey).first<{ usage_count: number }>();
  
  const current = usage?.usage_count || 0;
  const limitNum = parseInt(limit);
  
  return {
    allowed: current < limitNum,
    limit,
    current
  };
}

// ============================================================
// GET /api/marketplace/products - List all products with filtering
// ============================================================
app.get('/products', async (c) => {
  try {
    const productType = c.req.query('type'); // template, ai_service, book_template
    const category = c.req.query('category');
    const featured = c.req.query('featured');
    
    let query = 'SELECT * FROM marketplace_products WHERE is_active = 1';
    const params: any[] = [];
    
    if (productType) {
      query += ' AND product_type = ?';
      params.push(productType);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (featured === 'true') {
      query += ' AND is_featured = 1';
    }
    
    query += ' ORDER BY sort_order ASC, purchase_count DESC, created_at DESC';
    
    const products = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      products: products.results
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/products/:id - Get product details
// ============================================================
app.get('/products/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    
    const product = await c.env.DB.prepare(
      'SELECT * FROM marketplace_products WHERE id = ? AND is_active = 1'
    ).bind(productId).first();
    
    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      product
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/categories - List all categories
// ============================================================
app.get('/categories', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM marketplace_products
      WHERE is_active = 1 AND category IS NOT NULL
      GROUP BY category
      ORDER BY category
    `).all();
    
    return c.json({
      success: true,
      categories: categories.results
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// POST /api/marketplace/purchase - Process product purchase
// ============================================================
app.post('/purchase', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const { product_id, payment_method, payment_id, quantity = 1 } = await c.req.json();
    
    if (!product_id) {
      return c.json({
        success: false,
        message: 'Product ID is required'
      }, 400);
    }
    
    // Get product details
    const product = await c.env.DB.prepare(
      'SELECT * FROM marketplace_products WHERE id = ? AND is_active = 1'
    ).bind(product_id).first<any>();
    
    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }
    
    // Calculate total amount
    const totalAmount = product.price_usd * quantity;
    
    // Determine purchase type
    let purchaseType = 'one_time';
    if (product.is_subscription) {
      purchaseType = 'subscription';
    } else if (product.product_type === 'ai_service' && product.credits_cost > 0) {
      purchaseType = 'credits';
    }
    
    // Create purchase record
    const purchaseResult = await c.env.DB.prepare(`
      INSERT INTO marketplace_purchases (
        user_id, product_id, purchase_type, quantity, amount_usd,
        payment_method, payment_id, status, purchased_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `).bind(
      user.id,
      product_id,
      purchaseType,
      quantity,
      totalAmount,
      payment_method || 'credits',
      payment_id || null
    ).run();
    
    const purchaseId = purchaseResult.meta.last_row_id;
    
    // If product grants credits, add them to user account
    if (product.product_type === 'ai_service' && product.metadata) {
      try {
        const metadata = typeof product.metadata === 'string' 
          ? JSON.parse(product.metadata) 
          : product.metadata;
        
        if (metadata.credits) {
          const creditsToAdd = metadata.credits * quantity;
          const bonusCredits = metadata.bonus ? metadata.bonus * quantity : 0;
          const totalCredits = creditsToAdd + bonusCredits;
          
          await addCredits(
            c.env.DB,
            user.id,
            totalCredits,
            'purchase',
            `Purchased ${product.name} (${creditsToAdd} credits${bonusCredits > 0 ? ` + ${bonusCredits} bonus` : ''})`,
            purchaseId,
            'purchase'
          );
        }
      } catch (e) {
        console.error('Error processing credits:', e);
      }
    }
    
    // Update product purchase count
    await c.env.DB.prepare(
      'UPDATE marketplace_products SET purchase_count = purchase_count + ? WHERE id = ?'
    ).bind(quantity, product_id).run();
    
    return c.json({
      success: true,
      message: 'Purchase completed successfully',
      purchase_id: purchaseId,
      product: product.name,
      amount: totalAmount
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/my-purchases - Get user's purchase history
// ============================================================
app.get('/my-purchases', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const purchases = await c.env.DB.prepare(`
      SELECT 
        mp.*,
        p.name as product_name,
        p.product_type,
        p.category
      FROM marketplace_purchases mp
      JOIN marketplace_products p ON mp.product_id = p.id
      WHERE mp.user_id = ?
      ORDER BY mp.purchased_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      purchases: purchases.results
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/credits/balance - Get user's credit balance
// ============================================================
app.get('/credits/balance', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    // Initialize credits if not exists
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO user_credits (user_id, balance, total_purchased, total_used)
      VALUES (?, 0, 0, 0)
    `).bind(user.id).run();
    
    const credits = await c.env.DB.prepare(
      'SELECT * FROM user_credits WHERE user_id = ?'
    ).bind(user.id).first();
    
    return c.json({
      success: true,
      credits: credits || {
        balance: 0,
        total_purchased: 0,
        total_used: 0
      }
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/credits/transactions - Get credit transaction history
// ============================================================
app.get('/credits/transactions', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const transactions = await c.env.DB.prepare(`
      SELECT * FROM credit_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();
    
    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = ?'
    ).bind(user.id).first<{ total: number }>();
    
    return c.json({
      success: true,
      transactions: transactions.results,
      total: countResult?.total || 0,
      limit,
      offset
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// POST /api/marketplace/credits/use - Deduct credits (internal use by AI services)
// ============================================================
app.post('/credits/use', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const { amount, description, related_id, related_type } = await c.req.json();
    
    if (!amount || amount <= 0) {
      return c.json({
        success: false,
        message: 'Invalid credit amount'
      }, 400);
    }
    
    await deductCredits(
      c.env.DB,
      user.id,
      amount,
      description || 'Credit usage',
      related_id,
      related_type
    );
    
    // Get new balance
    const newBalance = await getUserCredits(c.env.DB, user.id);
    
    return c.json({
      success: true,
      message: 'Credits deducted successfully',
      balance: newBalance,
      amount_deducted: amount
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 400);
  }
});

// ============================================================
// GET /api/marketplace/my-templates - Get user's purchased templates
// ============================================================
app.get('/my-templates', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const templates = await c.env.DB.prepare(`
      SELECT DISTINCT
        p.*,
        mp.purchased_at,
        mp.status as purchase_status
      FROM marketplace_purchases mp
      JOIN marketplace_products p ON mp.product_id = p.id
      WHERE mp.user_id = ?
        AND (p.product_type = 'template' OR p.product_type = 'book_template')
        AND mp.status = 'completed'
      ORDER BY mp.purchased_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      templates: templates.results
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/subscription/features - Get user's subscription features
// ============================================================
app.get('/subscription/features', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    // Get all features for user's tier
    const features = await c.env.DB.prepare(`
      SELECT feature_key, feature_value
      FROM subscription_features
      WHERE tier = ?
    `).bind(user.subscription_tier).all();
    
    // Get current usage for this month
    const usage = await c.env.DB.prepare(`
      SELECT feature_key, usage_count
      FROM subscription_usage
      WHERE user_id = ?
        AND period_start >= date('now', 'start of month')
    `).bind(user.id).all();
    
    // Build feature map with usage
    const featureMap: any = {};
    for (const feature of features.results as any[]) {
      const usageRecord = (usage.results as any[]).find(u => u.feature_key === feature.feature_key);
      featureMap[feature.feature_key] = {
        limit: feature.feature_value,
        used: usageRecord?.usage_count || 0,
        remaining: feature.feature_value === 'unlimited' 
          ? 'unlimited' 
          : Math.max(0, parseInt(feature.feature_value) - (usageRecord?.usage_count || 0))
      };
    }
    
    return c.json({
      success: true,
      tier: user.subscription_tier,
      features: featureMap
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// POST /api/marketplace/reviews - Add product review
// ============================================================
app.post('/reviews', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const { product_id, rating, comment } = await c.req.json();
    
    if (!product_id || !rating) {
      return c.json({
        success: false,
        message: 'Product ID and rating are required'
      }, 400);
    }
    
    if (rating < 1 || rating > 5) {
      return c.json({
        success: false,
        message: 'Rating must be between 1 and 5'
      }, 400);
    }
    
    // Check if user has purchased this product
    const purchase = await c.env.DB.prepare(`
      SELECT id FROM marketplace_purchases
      WHERE user_id = ? AND product_id = ? AND status = 'completed'
      LIMIT 1
    `).bind(user.id, product_id).first();
    
    if (!purchase) {
      return c.json({
        success: false,
        message: 'You must purchase this product before reviewing'
      }, 403);
    }
    
    // Check if user already reviewed this product
    const existingReview = await c.env.DB.prepare(`
      SELECT id FROM marketplace_reviews
      WHERE user_id = ? AND product_id = ?
    `).bind(user.id, product_id).first();
    
    if (existingReview) {
      // Update existing review
      await c.env.DB.prepare(`
        UPDATE marketplace_reviews
        SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(rating, comment || null, (existingReview as any).id).run();
      
      return c.json({
        success: true,
        message: 'Review updated successfully'
      });
    } else {
      // Create new review
      await c.env.DB.prepare(`
        INSERT INTO marketplace_reviews (user_id, product_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(user.id, product_id, rating, comment || null).run();
      
      return c.json({
        success: true,
        message: 'Review added successfully'
      });
    }
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// ============================================================
// GET /api/marketplace/reviews/:productId - Get product reviews
// ============================================================
app.get('/reviews/:productId', async (c) => {
  try {
    const productId = parseInt(c.req.param('productId'));
    
    const reviews = await c.env.DB.prepare(`
      SELECT 
        r.*,
        u.username,
        u.email
      FROM marketplace_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).bind(productId).all();
    
    // Calculate average rating
    const avgResult = await c.env.DB.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM marketplace_reviews
      WHERE product_id = ?
    `).bind(productId).first<{ avg_rating: number; review_count: number }>();
    
    return c.json({
      success: true,
      reviews: reviews.results,
      average_rating: avgResult?.avg_rating || 0,
      review_count: avgResult?.review_count || 0
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

export default app;
