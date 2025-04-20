-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.add_user_credits(TEXT, INTEGER);

-- Create RPC function to add credits to user profile
CREATE FUNCTION public.add_user_credits(
  p_stripe_customer_id TEXT,
  p_credits_to_add INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile JSONB;
BEGIN
  -- Update the user's credits and return the updated profile
  UPDATE public.user_profiles
  SET 
    credits = credits + p_credits_to_add,
    updated_at = now()
  WHERE stripe_customer_id = p_stripe_customer_id
  RETURNING to_jsonb(user_profiles.*) INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No user found with stripe_customer_id: %', p_stripe_customer_id;
  END IF;

  RETURN updated_profile;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_user_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(TEXT, INTEGER) TO service_role;
