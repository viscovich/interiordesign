import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno' // Use a specific version compatible with Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Stripe (ensure STRIPE_SECRET_KEY is set in Supabase secrets)
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  // Stripe Deno runtime requires this config
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16', // Use a fixed API version
})

// Initialize Supabase client (ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set)
// IMPORTANT: Use the SERVICE_ROLE_KEY for backend functions that modify data
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use Service Role Key for admin actions
   {
    auth: {
      // Prevent Supabase client from persisting session cookies in the function environment
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Get the webhook signing secret from environment variables (ensure STRIPE_WEBHOOK_SECRET is set)
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

// Get plan configurations from environment variables
const PRO_PLAN_PRICE_ID = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? '';
const ENTERPRISE_PLAN_PRICE_ID = Deno.env.get('STRIPE_ENTERPRISE_PRICE_ID') ?? '';
const PRO_PLAN_CREDITS = parseInt(Deno.env.get('PRO_PLAN_CREDITS') ?? '250');
const ENTERPRISE_PLAN_CREDITS = parseInt(Deno.env.get('ENTERPRISE_PLAN_CREDITS') ?? '1000');

// --- Database Function Call ---
// Assumes a PostgreSQL function `add_user_credits(p_stripe_customer_id TEXT, p_credits_to_add INT)` exists
async function addCreditsToUser(stripeCustomerId: string, creditsToAdd: number) {
  console.log(`Attempting to add ${creditsToAdd} credits for customer ${stripeCustomerId}`);
  const { data, error } = await supabaseAdmin.rpc('add_user_credits', {
    p_stripe_customer_id: stripeCustomerId,
    p_credits_to_add: creditsToAdd,
  });

  if (error) {
    console.error('Error calling add_user_credits RPC:', error);
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  console.log('Successfully added credits via RPC:', data);
  return data;
}
// --- End Database Function Call ---


serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text() // Read body as text for signature verification

  // Handle CORS preflight request (optional but good practice)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust as needed for security
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
      },
    });
  }

  // Standard headers for responses
  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*', // Adjust as needed
    'Content-Type': 'application/json',
  });

  if (!signature || !stripeWebhookSecret) {
    console.error('Missing Stripe signature or webhook secret.')
    return new Response(JSON.stringify({ error: 'Webhook configuration error.' }), { status: 400, headers: responseHeaders })
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret
    )
    console.log(`Received Stripe event: ${event.type}`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }), { status: 400, headers: responseHeaders })
  }

  // Handle the specific event type
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;

    // Check if it's a subscription payment and has line items
    if (invoice.subscription && invoice.lines?.data?.length > 0) {
      const customerId = invoice.customer as string; // Stripe Customer ID
      const priceId = invoice.lines.data[0].price?.id; // Price ID from the first line item

      console.log(`Processing invoice.payment_succeeded for customer: ${customerId}, price: ${priceId}`);

      if (!customerId || !priceId) {
         console.error('Missing customer ID or price ID in invoice line item.');
         return new Response(JSON.stringify({ error: 'Missing customer or price ID.' }), { status: 400, headers: responseHeaders });
      }

      // Determine which plan was purchased and assign appropriate credits
      let creditsToAdd = 0;
      if (priceId === PRO_PLAN_PRICE_ID) {
        creditsToAdd = PRO_PLAN_CREDITS;
      } else if (priceId === ENTERPRISE_PLAN_PRICE_ID) {
        creditsToAdd = ENTERPRISE_PLAN_CREDITS;
      }

      if (creditsToAdd > 0) {
        try {
          // First ensure the user profile exists with this stripe_customer_id
          const { data: profileData, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (profileError || !profileData) {
            // If no profile found, try to find by email (from Stripe customer)
            const stripeCustomer = await stripe.customers.retrieve(customerId);
            if (stripeCustomer.deleted) {
              throw new Error(`Stripe customer ${customerId} was deleted`);
            }

            const customerEmail = typeof stripeCustomer.email === 'string' ? stripeCustomer.email : null;
            if (!customerEmail) {
              throw new Error(`No email found for Stripe customer ${customerId}`);
            }

            // Update or create user profile with stripe_customer_id
            const { error: upsertError } = await supabaseAdmin
              .from('user_profiles')
              .upsert({
                email: customerEmail,
                stripe_customer_id: customerId,
                current_plan: priceId === PRO_PLAN_PRICE_ID ? 'Pro' : 'Enterprise',
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'email'
              });

            if (upsertError) throw upsertError;
          } else {
            // Profile exists, just update plan and status
            const { error: updateError } = await supabaseAdmin
              .from('user_profiles')
              .update({ 
                current_plan: priceId === PRO_PLAN_PRICE_ID ? 'Pro' : 'Enterprise',
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_customer_id', customerId);

            if (updateError) throw updateError;
          }

          // Add credits
          await addCreditsToUser(customerId, creditsToAdd);
        } catch (err) {
          console.error('Error updating user profile:', err);
          return new Response(JSON.stringify({ error: 'Failed to update user profile' }), { 
            status: 500, 
            headers: responseHeaders 
          });
        }
      }
    }
  } else if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.subscription) {
      const customerId = invoice.customer as string;
      
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          subscription_status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error('Error updating subscription status:', error);
        return new Response(JSON.stringify({ error: 'Failed to update subscription status' }), { 
          status: 500, 
          headers: responseHeaders 
        });
      }
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Error canceling subscription:', error);
      return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), { 
        status: 500, 
        headers: responseHeaders 
      });
    }
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt of the event to Stripe
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: responseHeaders })
})

console.log('Stripe webhook handler function started.');
