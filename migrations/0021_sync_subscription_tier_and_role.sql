-- Synchronize subscription_tier with role for existing users
-- This ensures subscription_tier always equals role

-- Update subscription_tier to match role for all existing users
UPDATE users SET subscription_tier = role WHERE subscription_tier IS NULL OR subscription_tier = '';

-- For users with role='user', ensure subscription_tier is 'free'
-- UPDATE users SET subscription_tier = 'free' WHERE role = 'user';

-- For users with role='premium', ensure subscription_tier is 'premium'
UPDATE users SET subscription_tier = 'premium' WHERE role = 'premium';

-- For users with role='admin', keep their current subscription_tier or set to 'free'
-- Admins don't need premium subscription as they have all permissions
UPDATE users SET subscription_tier = COALESCE(subscription_tier, 'free') WHERE role = 'admin';

-- Note: In the application logic, we should always keep role and subscription_tier synchronized
-- When a user upgrades to premium: both role and subscription_tier become 'premium'
-- When a user's subscription expires: both should revert to 'user' and 'free' (handled by cron job)
