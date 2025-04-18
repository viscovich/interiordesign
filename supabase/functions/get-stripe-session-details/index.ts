import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.12.0?target=deno&deno-std=0.177.0'; // Use Deno compatible import
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have a shared CORS config

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16', // Use the same API version as your other functions
  httpClient: Stripe.createFetchHttpClient(), // Required for Deno runtime
});

serve(async (req: Request) => { // Add type Request to req
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin); // Get headers for the current origin

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers }); // Use generated headers
  }

  try {
    // Parse the request body to get the session_id
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error('Missing session_id in request body');
    }

    // Retrieve the session details from Stripe
    // Expand customer and line_items for more details if needed
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'line_items'],
    });

    // Return the session details
    return new Response(
      JSON.stringify(session),
      {
        headers: { ...headers, 'Content-Type': 'application/json' }, // Use generated headers
        status: 200,
      }
    );
  } catch (error: unknown) { // Add type unknown to error
    console.error('Error retrieving Stripe session:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Return an error response
    return new Response(
      JSON.stringify({ error: errorMessage || 'Failed to retrieve session' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' }, // Use generated headers
        status: 400, // Use 400 for client errors (like missing session_id) or 500 for server errors
      }
    );
  }
});

// Note: You might need to create the `supabase/functions/_shared/cors.ts` file
// if it doesn't exist. It typically looks like this:
/*
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specific origin like Deno.env.get('SITE_URL')
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
*/
