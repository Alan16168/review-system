-- Update free users to have permanent expiry date
-- Set subscription_expires_at to '9999-12-31 23:59:59' for all users with role='user' or subscription_tier='free'

-- Update all free users (role='user') to have permanent expiry date
UPDATE users 
SET subscription_expires_at = '9999-12-31 23:59:59'
WHERE (role = 'user' OR subscription_tier = 'free') 
  AND (subscription_expires_at IS NULL OR subscription_expires_at = '');

-- Ensure subscription_tier is set correctly
UPDATE users 
SET subscription_tier = 'free'
WHERE role = 'user' AND (subscription_tier IS NULL OR subscription_tier = '');

UPDATE users 
SET subscription_tier = 'premium'
WHERE role = 'premium' AND (subscription_tier IS NULL OR subscription_tier != 'premium');
