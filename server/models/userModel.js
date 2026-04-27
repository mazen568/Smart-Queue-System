import mongoose from "mongoose";
import bcrypt from "bcrypt"
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [30, "Name must be less than 30 characters long"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "reception"],
      default: "admin",
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    refreshToken:{
      type:String,
      select:false
    }
  },
  { timestamps: true },
);

// userSchema.index({ email: 1 }, { unique: true }); 
userSchema.index({ clinicId: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("User", userSchema);

export default userModel;
