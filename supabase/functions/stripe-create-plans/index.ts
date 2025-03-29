import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')

serve(async (req) => {
  try {
    const { plans } = await req.json()
    
    const createdPlans = await Promise.all(
      plans.map(async (plan: any) => {
        const product = await stripe.products.create({
          name: plan.name,
          default_price_data: {
            currency: 'eur',
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval
            }
          },
          features: plan.features.map((f: string) => ({ name: f }))
        })
        return product
      })
    )

    return new Response(
      JSON.stringify({ success: true, plans: createdPlans }),
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
