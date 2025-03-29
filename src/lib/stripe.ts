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

// Funzione per creare i piani di test
export const createTestPlans = async () => {
  try {
    const { data, error } = await supabase
      .functions
      .invoke('stripe-create-plans', {
        body: {
          plans: [
            {
              name: 'Test Basic',
              price: 50, // 0.50€
              interval: 'month',
              features: ['3 generations per month', 'Standard resolution']
            },
            {
              name: 'Test Pro', 
              price: 100, // 1€
              interval: 'month',
              features: ['50 generations per month', 'High resolution']
            },
            {
              name: 'Test Business',
              price: 200, // 2€
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

// Funzione per avviare il checkout
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
