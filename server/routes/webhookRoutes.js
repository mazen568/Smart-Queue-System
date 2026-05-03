import express from "express"
import { handleStripeWebhook } from "../controllers/paymentController.js"

const router = express.Router()

router.post("/stripe", handleStripeWebhook)

export default router
