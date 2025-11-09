import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

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

// Middleware to check authentication
payment.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  const userResult = await c.env.DB.prepare(
    'SELECT id, email, role, subscription_tier, subscription_expires_at FROM users WHERE id = ?'
  ).bind(parseInt(token)).first();
  
  if (!userResult) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  c.set('user', userResult);
  await next();
});

// Get subscription info and pricing
payment.get('/subscription/info', async (c) => {
  try {
    const user = c.get('user');
    
    // Get premium subscription config
    const config = await getSubscriptionConfig(c.env.DB, 'premium');
    
    if (!config) {
      return c.json({ error: 'Subscription config not found' }, 404);
    }
    
    return c.json({
      currentTier: user.subscription_tier || 'free',
      expiresAt: user.subscription_expires_at,
      premium: {
        price: config.price_usd,
        durationDays: config.duration_days,
        description: config.description,
        descriptionEn: config.description_en,
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
    const user = c.get('user');
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
      user.id,
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
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Capture PayPal payment and activate subscription
payment.post('/subscription/capture-order', async (c) => {
  try {
    const user = c.get('user');
    const { orderId } = await c.req.json();
    
    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400);
    }
    
    // Get payment record
    const payment = await c.env.DB.prepare(
      'SELECT * FROM payments WHERE paypal_order_id = ? AND user_id = ?'
    ).bind(orderId, user.id).first();
    
    if (!payment) {
      return c.json({ error: 'Payment record not found' }, 404);
    }
    
    if (payment.payment_status === 'completed') {
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
    const expiryDate = new Date(startDate.getTime() + payment.subscription_duration_days * 24 * 60 * 60 * 1000);
    
    // Update user subscription
    await c.env.DB.prepare(`
      UPDATE users 
      SET subscription_tier = ?,
          subscription_expires_at = ?,
          role = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      payment.subscription_tier,
      expiryDate.toISOString(),
      'premium',
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
        tier: payment.subscription_tier,
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
    const user = c.get('user');
    
    const payments = await c.env.DB.prepare(`
      SELECT 
        id, amount_usd, currency, payment_method, payment_status,
        subscription_tier, subscription_duration_days,
        created_at, completed_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({ payments: payments.results || [] });
  } catch (error) {
    console.error('Get payment history error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default payment;
