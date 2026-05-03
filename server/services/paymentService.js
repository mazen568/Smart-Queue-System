import { getStripe } from "../config/stripe.config.js"
import Payment from "../models/paymentModel.js"
import { AppError } from "../helpers/AppError.js"
import { addCredits } from "./creditsService.js"

const CREDIT_PACKAGES = {
  50: { amount: 500 },
  100: { amount: 900 },
  200: { amount: 1600 },
}

export const createStripeCheckoutSession = async ({ clinicId, credits, baseUrl }) => {
  const selectedPackage = CREDIT_PACKAGES[credits]
  if (!selectedPackage) {
    throw new AppError("Invalid credits package. Allowed values: 50, 100, 200", 400)
  }

  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${baseUrl}/admin/billing?success=true`,
    cancel_url: `${baseUrl}/admin/billing?canceled=true`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: selectedPackage.amount,
          product_data: {
            name: `${credits} Credits Package`,
          },
        },
      },
    ],
    metadata: {
      clinicId: String(clinicId),
      credits: String(credits),
    },
  })

  // If we're running with the mock Stripe client, immediately mark payment as completed
  if (stripe && stripe.__isMock) {
    console.warn("Using mock Stripe: creating completed payment and applying credits immediately")
    const payment = await Payment.create({
      clinicId,
      amount: selectedPackage.amount / 100,
      credits,
      method: "stripe",
      status: "completed",
      stripeSessionId: session.id,
      creditsApplied: true,
    })

    try {
      await addCredits(clinicId, credits)
    } catch (err) {
      // log but don't fail the checkout creation flow
      console.error("Failed to apply credits after mock payment:", err)
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      mocked: true,
      paymentId: payment._id,
    }
  }

  await Payment.create({
    clinicId,
    amount: selectedPackage.amount / 100,
    credits,
    method: "stripe",
    status: "pending",
    stripeSessionId: session.id,
  })

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  }
}

export const getClinicPayments = async ({ clinicId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Payment.find({ clinicId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments({ clinicId }),
  ])

  return {
    items,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  }
}

export const handleStripeCheckoutCompleted = async (session) => {
  const clinicId = session?.metadata?.clinicId
  const credits = Number(session?.metadata?.credits || 0)

  if (!clinicId || !credits) {
    throw new AppError("Stripe session metadata is missing clinicId or credits", 400)
  }

  let payment = await Payment.findOne({ stripeSessionId: session.id })

  if (!payment) {
    payment = await Payment.create({
      clinicId,
      amount: (session.amount_total || 0) / 100,
      credits,
      method: "stripe",
      status: "completed",
      stripeSessionId: session.id,
      creditsApplied: false,
    })
  } else if (payment.status !== "completed") {
    payment.status = "completed"
    await payment.save()
  }

  if (!payment.creditsApplied) {
    await addCredits(clinicId, credits)
    payment.creditsApplied = true
    await payment.save()
  }
}
