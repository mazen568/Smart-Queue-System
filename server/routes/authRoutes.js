import express from "express"
import {validateBody} from "../middlewares/validationMiddleware.js"
import { loginSchema, registerSchema } from "../validations/authValidations.js"
import { getUser, login , logout, refresh, register } from "../controllers/authController.js"
import authenticate from "../middlewares/authenticationMiddleware.js"
import authorize from "../middlewares/authorizationMiddleware.js"

const router = express.Router()

// @route   POST /api/v1/auth/login
// @desc    Authenticate user and get token
router.post("/login",validateBody(loginSchema) ,login )

router.post("/register",validateBody(registerSchema), register)

router.post("/refresh",refresh)

router.get("/me",authenticate , getUser)

router.post("/logout",authenticate,logout)

export default router