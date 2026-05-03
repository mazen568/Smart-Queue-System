import mongoose from "mongoose"

const { Schema } = mongoose

const creditsSchema = new Schema({
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true })


const creditsModel = mongoose.model("Credits", creditsSchema)

export default creditsModel