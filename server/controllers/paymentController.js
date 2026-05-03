import {
  createStripeCheckoutSession,
  getClinicPayments,
  handleStripeCheckoutCompleted,
} from "../services/paymentService.js"

export const createStripeCheckout = async (req, res, next) => {
  try {
    console.log("Creating checkout session for clinicId:", req.user.clinicId, "credits:", req.body.credits)
    const result = await createStripeCheckoutSession({
      clinicId: req.user.clinicId,
      credits: req.body.credits,
      baseUrl: process.env.CLIENT_URL || "http://localhost:4200",
    })

    res.status(201).json({
      success: true,
      message: "Stripe checkout session created successfully",
      data: result,
    })
  } catch (error) {
    console.log(error)
    next(error)
  }
}

export const getPaymentsHistory = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 10)

    const data = await getClinicPayments({
      clinicId: req.user.clinicId,
      page,
      limit,
    })

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: data.items,
      pagination: data.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export const handleStripeWebhook = async (req, res, next) => {
  try {
    const event = req.body

    if (event?.type === "checkout.session.completed") {
      await handleStripeCheckoutCompleted(event.data.object)
    }

    res.status(200).json({
      success: true,
      message: "Webhook received",
    })
  } catch (error) {
    next(error)
  }
}
