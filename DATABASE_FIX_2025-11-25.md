# Database Fix - Subscription Config (2025-11-25)

## Problem
Production database was missing `subscription_config` table, causing cart and pricing to fail.

## Solution
Manually created table and inserted data:
- Free: $0/year
- Premium: $2/year  
- Super: $2/year

## Commands Used
```bash
# Create table
npx wrangler d1 execute review-system-production --remote --command="CREATE TABLE IF NOT EXISTS subscription_config (...)"

# Insert data
npx wrangler d1 execute review-system-production --remote --command="INSERT OR REPLACE INTO subscription_config (...)"
```

## Verification
```bash
npx wrangler d1 execute review-system-production --remote --command="SELECT * FROM subscription_config WHERE is_active = 1"
```

Result: 3 rows (free, premium, super) all active with correct $2 pricing.

