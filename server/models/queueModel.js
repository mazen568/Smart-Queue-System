import mongoose from "mongoose";

const { Schema } = mongoose;

const queueSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    currentNumber: {
      type: Number,
      default: 0,
    },
    avgServiceTime: {
      type: Number, // in minutes(ana asf ya shawky lw 7aga bayza)
      required: true,
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalServedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

queueSchema.index({ clinicId: 1 });

queueSchema.index({ clinicId: 1, isActive: 1 });

const queueModel = mongoose.model("Queue", queueSchema);

export default queueModel;
