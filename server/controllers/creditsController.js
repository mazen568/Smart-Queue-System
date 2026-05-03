import { AppError } from "../helpers/AppError.js"
import { addCredits, deductOneCredit, getClinicCredits } from "../services/creditsService.js"

export const getCreditsBalance = async (req, res, next) => {
  try {
    const credits = await getClinicCredits(req.user.clinicId)

    res.status(200).json({
      success: true,
      message: "Credits fetched successfully",
      data: credits,
    })
  } catch (error) {
    next(error)
  }
}

export const deductCredit = async (req, res, next) => {
  try {
    const clinicId = req.body?.clinicId || req.user?.clinicId

    if (!clinicId) {
      throw new AppError("clinicId is required", 400)
    }

    const credits = await deductOneCredit(clinicId)

    res.status(200).json({
      success: true,
      message: "Credit deducted successfully",
      data: credits,
    })
  } catch (error) {
    next(error)
  }
}

export const topUpCredits = async (req, res, next) => {
  try {
    const clinicId = req.body?.clinicId || req.user?.clinicId
    const amount = Number(req.body?.credits || 0)

    if (!clinicId) {
      throw new AppError("clinicId is required", 400)
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("credits must be a positive number", 400)
    }

    const credits = await addCredits(clinicId, amount)

    res.status(200).json({
      success: true,
      message: "Credits added successfully",
      data: credits,
    })
  } catch (error) {
    next(error)
  }
}