# Resend Domain Setup Guide - ireviewsystem.com

## Current Status
- ✅ Code updated to use `noreply@ireviewsystem.com`
- ✅ Deployed to production
- ⏳ Waiting for domain verification in Resend

## Step 1: Add Domain to Resend

1. Visit: https://resend.com/domains
2. Click **"Add Domain"** button
3. Enter domain: `ireviewsystem.com`
4. Click **"Add"**

## Step 2: Get DNS Records from Resend

After adding the domain, Resend will display the DNS records you need to add. They typically look like this:

### Example DNS Records (yours will be different):

#### SPF Record (TXT)
```
Type: TXT
Name: @ (or ireviewsystem.com)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### DKIM Record (TXT)
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (long string)
TTL: 3600
```

#### DMARC Record (TXT) - Optional but recommended
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@ireviewsystem.com
TTL: 3600
```

## Step 3: Add DNS Records to Your Domain

### If using Cloudflare DNS:
1. Log in to Cloudflare Dashboard
2. Select `ireviewsystem.com` domain
3. Go to **DNS** tab
4. Click **"Add record"** for each record above
5. Set **Proxy status** to **DNS only** (gray cloud icon)

### If using other DNS provider:
1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS management section
3. Add the TXT records shown in Resend Dashboard

## Step 4: Verify Domain in Resend

1. After adding DNS records, wait 5-10 minutes
2. Go back to Resend Dashboard: https://resend.com/domains
3. Click **"Verify"** button next to `ireviewsystem.com`
4. If verification fails, check:
   - DNS records are correct (no typos)
   - DNS has propagated (check at https://dnschecker.org)
   - Wait a bit longer (can take up to 48 hours in rare cases)

## Step 5: Test Email Sending

After domain is verified:

### Method 1: Use Admin Test Email Endpoint
1. Log in to Review System as admin
2. Open browser console (F12)
3. Run:
```javascript
const token = localStorage.getItem('token');

fetch('https://review-system.pages.dev/api/admin/test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'alan@alandeng.ca'
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data));
```

### Method 2: Test Password Reset
1. Go to https://review-system.pages.dev
2. Click "Forgot Password"
3. Enter: `alan@alandeng.ca`
4. Check email inbox (and spam folder)

## Troubleshooting

### DNS Not Propagating
- Check DNS propagation: https://dnschecker.org
- Search for: `ireviewsystem.com TXT`
- Wait 5-60 minutes for global propagation

### Verification Fails
- Double-check DNS records in Resend Dashboard match exactly
- Ensure no extra spaces in DNS record values
- Try removing and re-adding the domain in Resend

### Still Not Working
1. Check Resend Logs: https://resend.com/logs
2. Look for error messages
3. Common issues:
   - DNS records not added correctly
   - Domain not verified
   - API key issues

## After Verification Success

Once verified, emails will be sent from:
- **From Address**: `Review System <noreply@ireviewsystem.com>`
- **Reply-To**: Can be configured if needed
- **To**: Any email address (no restrictions)

## Current Deployment

- **Production URL**: https://review-system.pages.dev
- **Latest Deployment**: https://ed64324f.review-system.pages.dev
- **Code Status**: ✅ Updated to use ireviewsystem.com

## Next Steps

1. ⏳ Add domain to Resend
2. ⏳ Configure DNS records
3. ⏳ Verify domain
4. ✅ Test email sending
5. ✅ Celebrate! 🎉
