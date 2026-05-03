import { AppError } from "../helpers/AppError.js"
import { getClinicCredits } from "../services/creditsService.js"

export const requireCredits = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.body?.clinicId

    if (!clinicId) {
      throw new AppError("clinicId is required for credit validation", 400)
    }

    const credits = await getClinicCredits(clinicId)

    if ((credits?.balance || 0) <= 0) {
      throw new AppError("No credits available. Please top up to issue new tickets.", 402)
    }

    next()
  } catch (error) {
    next(error)
  }
}