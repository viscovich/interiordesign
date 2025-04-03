import { loadStripe } from '@stripe/stripe-js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

let stripePromise: Promise<any>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Create test plans
export const createTestPlans = async () => {
  try {
    const { data, error } = await supabase
      .functions
      .invoke('stripe-create-plans', {
        body: {
          plans: [
            {
              name: 'Test Basic',
              price: 50,
              interval: 'month',
              features: ['3 generations per month', 'Standard resolution']
            },
            {
              name: 'Test Pro', 
              price: 100,
              interval: 'month',
              features: ['50 generations per month', 'High resolution']
            },
            {
              name: 'Test Business',
              price: 200,
              interval: 'month',
              features: ['Unlimited generations', 'API access']
            }
          ]
        }
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating test plans:', error);
    throw error;
  }
};

// Start checkout session
export const startCheckout = async (priceId: string) => {
  try {
    const { data, error } = await supabase
      .functions
      .invoke('stripe-create-checkout', {
        body: { price_id: priceId }
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error starting checkout:', error);
    throw error;
  }
};

// NEW: Create billing portal session
export const createBillingPortal = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .functions
      .invoke('stripe-create-portal', {
        body: { customer_id: customerId }
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating billing portal:', error);
    throw error;
  }
};

// NEW: Get current subscription
export const getSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return {
      stripe_customer_id: data.stripe_customer_id || null,
      subscription_status: data.subscription_status || 'none',
      current_plan: data.current_plan || 'Free'
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return {
      stripe_customer_id: null,
      subscription_status: 'none',
      current_plan: 'Free'
    };
  }
};

// NEW: Get payment methods
export const getPaymentMethods = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .functions
      .invoke('stripe-get-payment-methods', {
        body: { customer_id: customerId }
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
};
