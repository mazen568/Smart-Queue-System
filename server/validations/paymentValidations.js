import { z } from "zod"

export const stripeCheckoutSchema = z.object({
  credits: z.union([z.literal(50), z.literal(100), z.literal(200)]),
})
