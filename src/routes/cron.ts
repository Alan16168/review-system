import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { sendEmail } from '../utils/email';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
};

const cron = new Hono<{ Bindings: Bindings }>();

// Cron job to send renewal reminders
// This should be called daily by Cloudflare Workers Cron Trigger
// or can be called manually via API for testing
cron.get('/send-renewal-reminders', async (c) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Find premium users whose subscription expires in 30 days
    const usersToRemind = await c.env.DB.prepare(`
      SELECT 
        u.id, 
        u.email, 
        u.username, 
        u.language,
        u.subscription_expires_at
      FROM users u
      WHERE u.subscription_tier = 'premium'
        AND u.subscription_expires_at IS NOT NULL
        AND DATE(u.subscription_expires_at) = DATE(?)
        AND NOT EXISTS (
          SELECT 1 FROM renewal_reminders rr
          WHERE rr.user_id = u.id
            AND rr.reminder_type = '30_days'
            AND DATE(rr.subscription_expires_at) = DATE(u.subscription_expires_at)
        )
    `).bind(thirtyDaysFromNow.toISOString()).all();
    
    let successCount = 0;
    let failCount = 0;
    
    // Send reminder emails
    for (const user of usersToRemind.results || []) {
      try {
        const expiryDate = new Date(user.subscription_expires_at as string);
        const formattedDate = expiryDate.toLocaleDateString(user.language === 'en' ? 'en-US' : 'zh-CN');
        
        const subject = user.language === 'en' 
          ? 'Your Premium Subscription is Expiring Soon'
          : '您的高级订阅即将到期';
        
        const html = user.language === 'en' ? `
          <h2>Hi ${user.username},</h2>
          <p>Your premium subscription will expire on <strong>${formattedDate}</strong> (30 days from now).</p>
          <p>To continue enjoying premium features, please renew your subscription:</p>
          <ol>
            <li>Log in to your account</li>
            <li>Go to User Settings</li>
            <li>Click the "Renew Subscription" button in the Subscription Management section</li>
          </ol>
          <p>Thank you for being a valued premium member!</p>
          <p>Best regards,<br>Review System Team</p>
        ` : `
          <h2>您好 ${user.username}，</h2>
          <p>您的高级订阅将于 <strong>${formattedDate}</strong> 到期（距今30天）。</p>
          <p>为了继续享受高级功能，请及时续费：</p>
          <ol>
            <li>登录您的账号</li>
            <li>进入"用户设置"</li>
            <li>在"订阅管理"区域点击"续费订阅"按钮</li>
          </ol>
          <p>感谢您成为我们尊贵的高级会员！</p>
          <p>此致<br>复盘系统团队</p>
        `;
        
        // Send email
        await sendEmail(
          c.env.RESEND_API_KEY || '',
          user.email as string,
          subject,
          html
        );
        
        // Record that reminder was sent
        await c.env.DB.prepare(`
          INSERT INTO renewal_reminders (user_id, reminder_type, subscription_expires_at)
          VALUES (?, '30_days', ?)
        `).bind(user.id, user.subscription_expires_at).run();
        
        successCount++;
      } catch (error) {
        console.error(`Failed to send reminder to user ${user.id}:`, error);
        failCount++;
      }
    }
    
    return c.json({
      success: true,
      message: 'Renewal reminders sent',
      stats: {
        totalUsers: usersToRemind.results?.length || 0,
        successCount,
        failCount
      }
    });
  } catch (error) {
    console.error('Send renewal reminders error:', error);
    return c.json({ 
      error: 'Failed to send renewal reminders',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Check and expire subscriptions
// This should be called daily to downgrade expired premium users back to free
cron.get('/expire-subscriptions', async (c) => {
  try {
    const now = new Date();
    
    // Find premium users whose subscription has expired
    const expiredUsers = await c.env.DB.prepare(`
      SELECT id, email, username, subscription_expires_at
      FROM users
      WHERE subscription_tier = 'premium'
        AND role = 'premium'
        AND subscription_expires_at IS NOT NULL
        AND subscription_expires_at < ?
    `).bind(now.toISOString()).all();
    
    let downgradeCount = 0;
    
    // Downgrade expired users
    for (const user of expiredUsers.results || []) {
      try {
        // Update user to free tier - keep role and subscription_tier synchronized
        await c.env.DB.prepare(`
          UPDATE users
          SET subscription_tier = 'free',
              role = 'user',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(user.id).run();
        
        downgradeCount++;
        console.log(`Downgraded user ${user.id} (${user.email}) to free tier`);
      } catch (error) {
        console.error(`Failed to downgrade user ${user.id}:`, error);
      }
    }
    
    return c.json({
      success: true,
      message: 'Expired subscriptions processed',
      stats: {
        totalExpired: expiredUsers.results?.length || 0,
        downgradeCount
      }
    });
  } catch (error) {
    console.error('Expire subscriptions error:', error);
    return c.json({
      error: 'Failed to expire subscriptions',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Manual trigger endpoint (requires admin auth)
cron.post('/trigger-renewal-reminders', async (c) => {
  // In production, you should add admin authentication here
  // For now, just redirect to the GET endpoint
  return cron.request('/send-renewal-reminders', {
    method: 'GET',
  }, c.env as any);
});

export default cron;
