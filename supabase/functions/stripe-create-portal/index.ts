import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
)

serve(async (req) => {
  try {
    const { customer_id } = await req.json()
    const { data: { session: authSession } } = await supabase.auth.getSession()

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${Deno.env.get('SITE_URL')}/account`
    })

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
