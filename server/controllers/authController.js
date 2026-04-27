import { registerUser, loginUser, refreshToken } from "../services/authService.js";

import User from "../models/userModel.js"
import { AppError } from "../helpers/AppError.js";

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { refreshToken, ...user } = await loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    next(error);
  }
};


// POST /api/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const accessToken = await refreshToken(token);
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res) => {
  
    const user = await User.findById(req.user._id).select("-__v");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({ success: true,message:"User fetched successfully" ,data: user });
  
};


export const logout = async (req, res) => {
  // Clear from DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  // Clear cookie
  res.clearCookie("refreshToken");

  res.json({ success: true, message: "Logged out successfully" });
};