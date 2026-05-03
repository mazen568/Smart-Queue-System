import Credits from "../models/creditsModel.js"
import { AppError } from "../helpers/AppError.js"

export const getClinicCredits = async (clinicId) => {
  const credits = await Credits.findOne({ clinicId }).lean()

  if (!credits) {
    return {
      clinicId,
      balance: 0,
    }
  }

  return credits
}

export const deductOneCredit = async (clinicId) => {
  const updatedCredits = await Credits.findOneAndUpdate(
    {
      clinicId,
      balance: { $gt: 0 },
    },
    {
      $inc: { balance: -1 },
      $set: { updatedAt: new Date() },
    },
    { new: true }
  )

  if (!updatedCredits) {
    throw new AppError("Insufficient credits. Please top up to continue.", 402)
  }

  return updatedCredits
}

export const addCredits = async (clinicId, creditsToAdd) => {
  const updatedCredits = await Credits.findOneAndUpdate(
    { clinicId },
    {
      $inc: { balance: creditsToAdd },
      $set: { updatedAt: new Date() },
      $setOnInsert: { clinicId },
    },
    { upsert: true, new: true }
  )

  return updatedCredits
}