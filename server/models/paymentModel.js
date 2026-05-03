import mongoose from "mongoose"

const { Schema } = mongoose

const paymentSchema = new Schema({
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  credits: {
    type: Number,
    required: true,
    enum: [50, 100, 200],
  },
  method: {
    type: String,
    enum: ["stripe", "paypal"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  stripeSessionId: {
    type: String,
    trim: true,
  },
  creditsApplied: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true })

paymentSchema.index({ clinicId: 1 })

const paymentModel = mongoose.model("Payment", paymentSchema)

export default paymentModel