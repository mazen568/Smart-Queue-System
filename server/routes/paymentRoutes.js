import express from "express"
import authenticate from "../middlewares/authenticationMiddleware.js"
import authorize from "../middlewares/authorizationMiddleware.js"
import { createStripeCheckout, getPaymentsHistory } from "../controllers/paymentController.js"
import { validateZodBody } from "../middlewares/zodValidationMiddleware.js"
import { stripeCheckoutSchema } from "../validations/paymentValidations.js"

const router = express.Router()

router.use(authenticate)
router.use(authorize("admin"))

router.post("/stripe/checkout", validateZodBody(stripeCheckoutSchema), createStripeCheckout)
router.get("/", getPaymentsHistory)

export default router
