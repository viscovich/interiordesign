import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
)

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req.headers.get('origin')) })
  }

  // Verify content-type
  const contentType = req.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Invalid content-type' }),
      { status: 400, headers: corsHeaders(req.headers.get('origin')) }
    )
  }

  try {
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      throw new Error('Invalid JSON payload')
    }
    
    console.log('Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))
    console.log('Request body:', JSON.stringify(requestBody))
    
    if (!requestBody || !requestBody.customer_id) {
      throw new Error('Missing required customer_id in request body')
    }
    const { customer_id } = requestBody

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid Authorization header')
    }
    const accessToken = authHeader.split(' ')[1]
    
    // Initialize new client with user's access token
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'No valid user found'}`)
    }

    console.log('Creating portal session for customer:', customer_id, 'with user:', user.id)
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${Deno.env.get('SITE_URL')}/account`
    })
    console.log('Created portal session:', portalSession.url)

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(req.headers.get('origin'))
        } 
      }
    )
  } catch (error) {
    console.error('Error creating billing portal:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error ? error.stack || 'No additional details' : 'No stack trace available'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(req.headers.get('origin'))
        } 
      }
    )
  }
})
