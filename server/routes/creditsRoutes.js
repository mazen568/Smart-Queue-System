import express from "express"
import authenticate from "../middlewares/authenticationMiddleware.js"
import authorize from "../middlewares/authorizationMiddleware.js"
import { deductCredit, getCreditsBalance, topUpCredits } from "../controllers/creditsController.js"

const router = express.Router()

router.use(authenticate)
router.use(authorize("admin"))

router.get("/", getCreditsBalance)
router.post("/deduct", deductCredit)
router.post("/add", topUpCredits)

export default router