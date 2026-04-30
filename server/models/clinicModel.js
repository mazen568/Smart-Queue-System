import mongoose from "mongoose"

const { Schema } = mongoose

const clinicSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [30, "Name must be less than 30 characters long"],
    },
    description: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    logoUrl: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true })

clinicSchema.index({ name: 1 });

const clinicModel = mongoose.model("Clinic", clinicSchema)

export default clinicModel