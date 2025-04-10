import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
)

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Local development
  Deno.env.get('SITE_URL') || '' // Production site URL
].filter(Boolean); // Remove empty string if SITE_URL is not set

serve(async (req: Request) => { // Add Request type
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    const headers = new Headers({
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Common Supabase headers + content-type
    });

    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }

    return new Response(null, { status: 204, headers }); // 204 No Content for OPTIONS
  }

  // Handle actual POST request
  const origin = req.headers.get('Origin');
  const corsHeaders = new Headers({
    'Content-Type': 'application/json',
  });

  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders.set('Access-Control-Allow-Origin', origin);
  } else if (!origin && Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_test_')) {
    // Allow requests without an Origin header only in test mode (e.g., from Supabase dashboard)
    // Be cautious with this in production
    corsHeaders.set('Access-Control-Allow-Origin', '*'); 
  }


  try {
    // Ensure it's a POST request for checkout creation
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
    }

    const { price_id } = await req.json();
    
    // Get user session using Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: corsHeaders });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${Deno.env.get('SITE_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL')}/canceled`, // Use SITE_URL consistently
      customer_email: user.email, // Use authenticated user's email
      metadata: {
        user_id: user.id // Use authenticated user's ID
      }
    });

    return new Response(
      JSON.stringify({ sessionId: checkoutSession.id }), // Return the session ID instead of the URL
      { headers: corsHeaders } // Use prepared CORS headers
    );
  } catch (error: unknown) { // Type error as unknown
    console.error('Stripe Checkout Error:', error);
    // Ensure CORS headers are included in error responses too
    const errorHeaders = new Headers(corsHeaders); // Clone base CORS headers
    errorHeaders.set('Content-Type', 'application/json');

    // Safely access error properties
    let errorMessage = 'Internal Server Error';
    let errorStatus = 500;
    if (error instanceof Error) {
      errorMessage = error.message;
      // Attempt to get status if it exists (Stripe errors might have it)
      if ('status' in error && typeof error.status === 'number') {
        errorStatus = error.status;
      } else if ('statusCode' in error && typeof error.statusCode === 'number') { // Stripe SDK often uses statusCode
         errorStatus = error.statusCode;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorStatus, 
        headers: errorHeaders 
      }
    );
  }
})
