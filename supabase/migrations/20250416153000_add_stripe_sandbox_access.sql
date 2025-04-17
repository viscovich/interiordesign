-- Add stripe_sandbox_access flag to user_profiles table
BEGIN;

ALTER TABLE user_profiles 
ADD COLUMN stripe_sandbox_access BOOLEAN 
NOT NULL 
DEFAULT FALSE;

COMMENT ON COLUMN user_profiles.stripe_sandbox_access IS 'Flag for enabling Stripe sandbox access for testing paid features';

COMMIT;
