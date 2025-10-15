// Email utility functions using Resend API

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(apiKey: string, options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Review System <noreply@ireviewsystem.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
        reply_to: 'support@ireviewsystem.com',
        headers: {
          'X-Priority': '1',
          'X-Mailer': 'Review System',
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email via Resend:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        to: options.to,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      });
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully via Resend:', {
      id: result.id,
      to: options.to,
      from: 'Review System <onboarding@resend.dev>'
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  apiKey: string,
  to: string,
  resetUrl: string,
  username: string
): Promise<boolean> {
  const subject = 'Reset Your Review System Password';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 14px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${username}</strong>,</p>
        
        <p>We received a request to reset your password for your Review System account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <center>
          <a href="${resetUrl}" class="button">Reset Password</a>
        </center>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This link will expire in <strong>1 hour</strong></li>
            <li>If you didn't request this, please ignore this email</li>
            <li>Your password won't change unless you click the link above</li>
          </ul>
        </div>
        
        <p>If you have any questions, please contact our support team at <a href="mailto:support@ireviewsystem.com">support@ireviewsystem.com</a>.</p>
        
        <p>Best regards,<br><strong>Review System Team</strong></p>
      </div>
      <div class="footer">
        <p>You received this email because a password reset was requested for your account.</p>
        <p>Review System - <a href="https://review-system.pages.dev">https://review-system.pages.dev</a></p>
        <p>&copy; 2025 Review System. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request - Review System

Hi ${username},

We received a request to reset your password for your Review System account.

Click the link below to reset your password:
${resetUrl}

Security Notice:
- This link will expire in 1 hour
- If you didn't request this, please ignore this email
- Your password won't change unless you click the link above

Best regards,
Review System Team
  `;

  return sendEmail(apiKey, { to, subject, html, text });
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
