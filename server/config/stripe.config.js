import Stripe from "stripe"

let stripeClient = null

export const getStripe = () => {
  if (stripeClient) return stripeClient

  if (!process.env.STRIPE_SECRET_KEY) {
    // Fallback: provide a lightweight mock Stripe client for local/dev
    // This allows creating a fake checkout session when a real key isn't available.
    stripeClient = {
      __isMock: true,
      checkout: {
        sessions: {
          create: async (opts) => {
            const id = `mock_${Date.now()}`
            // prefer using the success_url provided by the caller to avoid env mismatches
            const successUrl = opts?.success_url || (process.env.CLIENT_URL || "http://localhost:4200") + "/admin/billing?success=true"
            // append mock flag and session id
            const sep = successUrl.includes('?') ? '&' : '?'
            return {
              id,
              url: `${successUrl}${sep}mock_checkout=true&session_id=${id}`,
              // echo back some useful fields for downstream handlers
              amount_total: (opts?.line_items?.[0]?.price_data?.unit_amount) || 0,
              metadata: opts?.metadata || {},
            }
          },
        },
      },
    }
    return stripeClient
  }

  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripeClient
}
