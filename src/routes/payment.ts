import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { authMiddleware } from '../middleware/auth';
import { UserPayload } from '../utils/auth';

type Bindings = {
  DB: D1Database;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_MODE: string; // 'sandbox' or 'live'
};

const payment = new Hono<{ Bindings: Bindings }>();

// Get PayPal access token
async function getPayPalAccessToken(clientId: string, clientSecret: string, mode: string) {
  const base = mode === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

// Get subscription configuration
async function getSubscriptionConfig(db: D1Database, tier: string) {
  const result = await db.prepare(
    'SELECT * FROM subscription_config WHERE tier = ? AND is_active = 1'
  ).bind(tier).first();
  
  return result;
}

// Apply authentication to all payment routes
payment.use('/*', authMiddleware);

// Get subscription info and pricing
payment.get('/subscription/info', async (c) => {
  try {
    const tokenUser = c.get('user') as UserPayload;
    
    // Get full user info from database including subscription fields
    const user = await c.env.DB.prepare(
      'SELECT id, email, role, subscription_tier, subscription_expires_at FROM users WHERE id = ?'
    ).bind(tokenUser.id).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Get both premium and super subscription configs
    const [premiumConfig, superConfig] = await Promise.all([
      getSubscriptionConfig(c.env.DB, 'premium'),
      getSubscriptionConfig(c.env.DB, 'super')
    ]);
    
    if (!premiumConfig || !superConfig) {
      return c.json({ error: 'Subscription config not found' }, 404);
    }
    
    return c.json({
      currentTier: user.subscription_tier || 'free',
      expiresAt: user.subscription_expires_at,
      premium: {
        price: premiumConfig.price_usd,
        renewal_price: premiumConfig.renewal_price_usd || premiumConfig.price_usd,
        durationDays: premiumConfig.duration_days,
        description: premiumConfig.description,
        descriptionEn: premiumConfig.description_en,
      },
      super: {
        price: superConfig.price_usd,
        renewal_price: superConfig.renewal_price_usd || superConfig.price_usd,
        durationDays: superConfig.duration_days,
        description: superConfig.description,
        descriptionEn: superConfig.description_en,
      }
    });
  } catch (error) {
    console.error('Get subscription info error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create PayPal order for subscription
payment.post('/subscription/create-order', async (c) => {
  try {
    const tokenUser = c.get('user') as UserPayload;
    const { tier } = await c.req.json();
    
    if (tier !== 'premium') {
      return c.json({ error: 'Invalid subscription tier' }, 400);
    }
    
    // Get subscription config
    const config = await getSubscriptionConfig(c.env.DB, tier);
    if (!config) {
      return c.json({ error: 'Subscription config not found' }, 404);
    }
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(
      c.env.PAYPAL_CLIENT_ID,
      c.env.PAYPAL_CLIENT_SECRET,
      c.env.PAYPAL_MODE || 'sandbox'
    );
    
    const base = c.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    // Create PayPal order
    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: config.price_usd.toString(),
          },
          description: `${config.description_en} - ${config.duration_days} days`,
        }],
        application_context: {
          brand_name: 'Review System',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${c.req.url.split('/api')[0]}/payment-success`,
          cancel_url: `${c.req.url.split('/api')[0]}/payment-cancel`,
        },
      }),
    });
    
    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      console.error('PayPal order creation failed:', orderData);
      return c.json({ error: 'Failed to create PayPal order' }, 500);
    }
    
    // Save payment record as pending
    await c.env.DB.prepare(`
      INSERT INTO payments (
        user_id, amount_usd, payment_status, paypal_order_id,
        subscription_tier, subscription_duration_days, transaction_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tokenUser.id,
      config.price_usd,
      'pending',
      orderData.id,
      tier,
      config.duration_days,
      JSON.stringify(orderData)
    ).run();
    
    return c.json({
      orderId: orderData.id,
      approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href,
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : String(error));
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Capture PayPal payment and activate subscription
payment.post('/subscription/capture-order', async (c) => {
  try {
    const tokenUser = c.get('user') as UserPayload;
    const { orderId } = await c.req.json();
    
    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400);
    }
    
    // Get full user info from database
    const user = await c.env.DB.prepare(
      'SELECT id, email, role, subscription_tier, subscription_expires_at FROM users WHERE id = ?'
    ).bind(tokenUser.id).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Get payment record
    const paymentRecord = await c.env.DB.prepare(
      'SELECT * FROM payments WHERE paypal_order_id = ? AND user_id = ?'
    ).bind(orderId, user.id).first();
    
    if (!paymentRecord) {
      return c.json({ error: 'Payment record not found' }, 404);
    }
    
    if (paymentRecord.payment_status === 'completed') {
      return c.json({ error: 'Payment already processed' }, 400);
    }
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(
      c.env.PAYPAL_CLIENT_ID,
      c.env.PAYPAL_CLIENT_SECRET,
      c.env.PAYPAL_MODE || 'sandbox'
    );
    
    const base = c.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    // Capture the payment
    const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const captureData = await captureResponse.json();
    
    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      
      // Update payment status to failed
      await c.env.DB.prepare(`
        UPDATE payments 
        SET payment_status = ?, transaction_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE paypal_order_id = ?
      `).bind('failed', JSON.stringify(captureData), orderId).run();
      
      return c.json({ error: 'Payment capture failed' }, 400);
    }
    
    // Calculate subscription expiry date
    const currentExpiry = user.subscription_expires_at 
      ? new Date(user.subscription_expires_at)
      : new Date();
    
    // If current subscription is still valid, extend from expiry date
    // Otherwise, start from now
    const startDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const expiryDate = new Date(startDate.getTime() + paymentRecord.subscription_duration_days * 24 * 60 * 60 * 1000);
    
    // Update user subscription - keep role and subscription_tier synchronized
    await c.env.DB.prepare(`
      UPDATE users 
      SET subscription_tier = ?,
          subscription_expires_at = ?,
          role = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      'premium',  // subscription_tier
      expiryDate.toISOString(),
      'premium',  // role - keep synchronized with subscription_tier
      user.id
    ).run();
    
    // Update payment record
    await c.env.DB.prepare(`
      UPDATE payments 
      SET payment_status = ?,
          paypal_payer_id = ?,
          transaction_data = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE paypal_order_id = ?
    `).bind(
      'completed',
      captureData.payer?.payer_id || null,
      JSON.stringify(captureData),
      orderId
    ).run();
    
    return c.json({
      success: true,
      subscription: {
        tier: paymentRecord.subscription_tier,
        expiresAt: expiryDate.toISOString(),
      }
    });
  } catch (error) {
    console.error('Capture order error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get payment history for current user
payment.get('/history', async (c) => {
  try {
    const tokenUser = c.get('user') as UserPayload;
    
    const payments = await c.env.DB.prepare(`
      SELECT 
        id, amount_usd, currency, payment_method, payment_status,
        subscription_tier, subscription_duration_days,
        created_at, completed_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(tokenUser.id).all();
    
    return c.json({ payments: payments.results || [] });
  } catch (error) {
    console.error('Get payment history error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default payment;

// ============ Cart Payment Endpoints ============

// Create PayPal order for cart items
payment.post('/cart/create-order', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Parse request body and validate items
    const body = await c.req.json();
    console.log('📦 Create order request body:', body);
    
    const checkoutItems = body.items;
    
    if (!checkoutItems || !Array.isArray(checkoutItems) || checkoutItems.length === 0) {
      console.error('❌ Cart is empty or invalid:', { checkoutItems });
      return c.json({ error: 'Cart is empty' }, 400);
    }
    
    console.log('✅ Checkout items validated:', checkoutItems.length);
    
    // Calculate total
    const total = checkoutItems.reduce((sum: number, item: any) => {
      const price = parseFloat(item.price_usd || item.price_user || '0');
      return sum + price;
    }, 0);
    
    console.log('💰 Total calculated:', total);
    
    // Get PayPal credentials
    const clientId = c.env.PAYPAL_CLIENT_ID;
    const clientSecret = c.env.PAYPAL_CLIENT_SECRET;
    const mode = c.env.PAYPAL_MODE || 'sandbox';
    
    if (!clientId || !clientSecret) {
      console.error('❌ PayPal not configured');
      return c.json({ error: 'PayPal not configured' }, 500);
    }
    
    // Get access token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);
    console.log('✅ PayPal access token obtained');
    
    // Create order
    const base = mode === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    const paypalItems = checkoutItems.map((item: any) => {
      const itemName = item.item_type === 'subscription' 
        ? `${item.tier === 'premium' ? 'Premium' : 'Super'} Membership`
        : (item.name_en || item.name || 'Product');
      
      const price = parseFloat(item.price_usd || item.price_user || '0');
      
      return {
        name: itemName,
        description: `${item.duration_days || 365} days subscription`,
        unit_amount: {
          currency_code: 'USD',
          value: price.toFixed(2)
        },
        quantity: '1'
      };
    });
    
    console.log('📝 PayPal items prepared:', paypalItems);
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: total.toFixed(2)
            }
          }
        },
        items: paypalItems
      }]
    };
    
    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const order = await orderResponse.json();
    
    if (!orderResponse.ok) {
      console.error('❌ PayPal create order error:', order);
      return c.json({ error: 'Failed to create PayPal order', details: order }, 500);
    }
    
    console.log('✅ PayPal order created:', order.id);
    
    // Save payment records for each item
    for (const item of checkoutItems) {
      const price = parseFloat(item.price_usd || item.price_user || '0');
      const tier = item.subscription_tier || item.tier || 'premium';
      const durationDays = item.duration_days || 365;
      
      await c.env.DB.prepare(`
        INSERT INTO payments (
          user_id, amount_usd, currency, payment_method, payment_status,
          paypal_order_id, subscription_tier, subscription_duration_days,
          transaction_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        price,
        'USD',
        'paypal',
        'pending',
        order.id,
        tier,
        durationDays,
        JSON.stringify({ cart_item_id: item.id, item_type: item.item_type || 'subscription' })
      ).run();
      
      console.log('✅ Payment record saved for item:', item.id);
    }
    
    return c.json({ 
      success: true,
      orderId: order.id 
    });
  } catch (error) {
    console.error('❌ Create cart order error:', error);
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

// Capture PayPal order for cart
payment.post('/cart/capture-order', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const { orderId } = await c.req.json();
    
    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400);
    }
    
    // Get PayPal credentials
    const clientId = c.env.PAYPAL_CLIENT_ID;
    const clientSecret = c.env.PAYPAL_CLIENT_SECRET;
    const mode = c.env.PAYPAL_MODE || 'sandbox';
    
    // Get access token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);
    
    // Capture order
    const base = mode === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const captureData = await captureResponse.json();
    
    if (!captureResponse.ok) {
      console.error('PayPal capture error:', captureData);
      
      // Update payment status to failed
      await c.env.DB.prepare(`
        UPDATE payments 
        SET payment_status = 'failed',
            transaction_data = ?
        WHERE paypal_order_id = ? AND user_id = ?
      `).bind(
        JSON.stringify(captureData),
        orderId,
        user.id
      ).run();
      
      return c.json({ error: 'Payment capture failed' }, 500);
    }
    
    // Get payment records
    const payments: any = await c.env.DB.prepare(`
      SELECT * FROM payments 
      WHERE paypal_order_id = ? AND user_id = ?
    `).bind(orderId, user.id).all();
    
    if (!payments.results || payments.results.length === 0) {
      return c.json({ error: 'Payment record not found' }, 404);
    }
    
    // Get payer info
    const payerId = captureData.payer?.payer_id || null;
    
    // Process each payment (upgrade or renewal)
    let newExpiryDate: Date | null = null;
    
    for (const payment of payments.results) {
      // Update payment status
      await c.env.DB.prepare(`
        UPDATE payments 
        SET payment_status = 'completed',
            paypal_payer_id = ?,
            completed_at = CURRENT_TIMESTAMP,
            transaction_data = ?
        WHERE id = ?
      `).bind(
        payerId,
        JSON.stringify(captureData),
        payment.id
      ).run();
      
      // Update user subscription
      const txData = JSON.parse(payment.transaction_data || '{}');
      const isRenewal = txData.item_type === 'renewal';
      
      // Get current user data
      const currentUser: any = await c.env.DB.prepare(`
        SELECT subscription_expires_at FROM users WHERE id = ?
      `).bind(user.id).first();
      
      // Calculate new expiry date
      const currentExpiry = currentUser.subscription_expires_at 
        ? new Date(currentUser.subscription_expires_at)
        : new Date();
      
      const startDate = (isRenewal && currentExpiry > new Date()) 
        ? currentExpiry 
        : new Date();
      
      newExpiryDate = new Date(startDate.getTime() + payment.subscription_duration_days * 24 * 60 * 60 * 1000);
    }
    
    // Update user role and subscription
    if (newExpiryDate) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET subscription_tier = 'premium',
            subscription_expires_at = ?,
            role = 'premium',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        newExpiryDate.toISOString(),
        user.id
      ).run();
    }
    
    return c.json({ 
      message: 'Payment successful',
      subscription_expires_at: newExpiryDate?.toISOString()
    });
  } catch (error) {
    console.error('Capture cart order error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
