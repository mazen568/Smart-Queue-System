import { AppError } from "../helpers/AppError.js";
import User from "../models/userModel.js";
import Clinic from "../models/clinicModel.js";
import mongoose from "mongoose";
import {generateAccessToken , generateRefreshToken} from "../helpers/generateJWT.js";

import jwt from "jsonwebtoken"

export const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError("User Already Exists");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const clinic = new Clinic({ name: userData.clinicName });
    await clinic.save({session})

    const user = new User({...userData,clinicId:clinic._id})
    await user.save({session})

    await session.commitTransaction()

    return user

  } catch (error) {
    await session.abortTransaction()
    const err = new AppError("Registration Failed",500)
    err.details = error
    throw err
  }finally{
    session.endSession()
  }


};

export const loginUser = async (userData)=>{
    const user = await User.findOne({ email: userData.email }).select("+password");
    if (!user || !(await user.comparePassword(userData.password))) {
        throw new AppError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save()

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        accessToken,
        refreshToken
    }
}

export const refreshToken = async (token) =>{
  
  if (!token) {
    return res.status(401).json({ success: false, message: "No refresh token" });
  }
  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check it matches what's stored in DB
  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== token) {
    console.log("token from cookies : ", token," token from DB : ", user?.refreshToken, " user from DB : ", user);
    
    throw new AppError("Invalid refresh token", 401);
  }

  // Issue new access token
  const payload = { _id: user._id, clinicId: user.clinicId, role: user.role };
  const accessToken = generateAccessToken(payload);

  return accessToken
}
