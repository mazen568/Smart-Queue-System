import mongoose from "mongoose";

const { Schema } = mongoose;

const ticketSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "called", "done", "cancelled"],
      default: "waiting",
    },
    customerName: {
      type: String,
      trim: true,
    },
    calledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Performance optimization for queue position calculation
ticketSchema.index({ queueId: 1, status: 1, createdAt: 1 });
ticketSchema.index({ clinicId: 1, createdAt: -1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ queueId: 1 });
ticketSchema.index({ clinicId: 1, queueId: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
