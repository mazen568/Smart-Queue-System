import mongoose from "mongoose"

const { Schema } = mongoose

const subscriptionSchema = new Schema({
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
  },
  plan: {
    type: String,
    enum: ["starter", "pro", "enterprise"],
    default: "starter",
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "expired"],
    default: "active",
  },
}, { timestamps: true })


const subscriptionModel = mongoose.model("Subscription", subscriptionSchema)

export default subscriptionModel