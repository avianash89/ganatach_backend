import Trainer from "../models/Trainer.js";
import twilio from "twilio";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// Temporary in-memory OTP store (for demo; use Redis for production)
const otpStore = {};

// ============================
// 🚀 SIGNUP + SEND OTP (do NOT save trainer yet)
// ============================
export const signupAndSendOtp = async (req, res) => {
  try {
    const { trainerName, phoneNumber, email, technology, experience } = req.body;

    const existingTrainer = await Trainer.findOne({ phoneNumber });
    if (existingTrainer) {
      return res.status(200).json({
        success: false,
        message: "⚠️ Trainer already exists. Please login!",
        alreadyExists: true,
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    otpStore[phoneNumber] = { trainerName, phoneNumber, email, technology, experience, otp, expires };

    await client.messages.create({
      body: `Your OTP for Trainer Signup is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${phoneNumber}`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent! Complete verification to register.",
      alreadyExists: false,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// ============================
// 🚀 LOGIN + SEND OTP
// ============================
export const loginAndSendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const trainer = await Trainer.findOne({ phoneNumber });

    if (!trainer) {
      return res.status(404).json({ success: false, message: "Trainer not found. Please sign up!" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    otpStore[phoneNumber] = { otp, expires, isLogin: true };

    await client.messages.create({
      body: `Your OTP for Trainer Login is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${phoneNumber}`,
    });

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Login OTP Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// ============================
// 🚀 VERIFY OTP & SAVE TRAINER (signup) OR LOGIN
// ============================
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, enteredOtp } = req.body;
    const tempData = otpStore[phoneNumber];

    if (!tempData) {
      return res.status(400).json({ success: false, message: "OTP not requested or expired" });
    }

    if (tempData.otp !== enteredOtp || tempData.expires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    let trainer;
    if (!tempData.isLogin) {
      const { trainerName, email, technology, experience } = tempData;
      trainer = new Trainer({ trainerName, phoneNumber, email, technology, experience });
      await trainer.save();
    } else {
      trainer = await Trainer.findOne({ phoneNumber });
    }

    delete otpStore[phoneNumber];

    const token = jwt.sign(
      { id: trainer._id, phoneNumber: trainer.phoneNumber, trainerName: trainer.trainerName, technology: trainer.technology },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("trainer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: tempData.isLogin ? "✅ OTP Verified! Trainer logged in." : "✅ OTP Verified! Trainer registered successfully.",
      trainer: {
        id: trainer._id,
        trainerName: trainer.trainerName,
        phoneNumber: trainer.phoneNumber,
        email: trainer.email,
        technology: trainer.technology,
        experience: trainer.experience,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};

// ============================
// 🚀 CHECK AUTH
// ============================
export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies?.trainer_token;
    if (!token) return res.status(401).json({ trainer: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ trainer: decoded });
  } catch (err) {
    console.error("CheckAuth Error:", err);
    res.status(401).json({ trainer: null });
  }
};

// ============================
// 🚀 LOGOUT
// ============================
export const logout = (req, res) => {
  res.clearCookie("trainer_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// ============================
// 🚀 GET ALL TRAINERS
// ============================
export const getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find();
    res.status(200).json(trainers);
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ success: false, message: "Error fetching trainers" });
  }
};

// ============================
// 🚀 GET SINGLE TRAINER
// ============================
export const getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });
    res.json(trainer);
  } catch (error) {
    console.error("Error fetching trainer:", error);
    res.status(500).json({ success: false, message: "Error fetching trainer" });
  }
};

// ============================
// 🚀 UPDATE TRAINER
// ============================
export const updateTrainer = async (req, res) => {
  try {
    const updatedTrainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTrainer) return res.status(404).json({ success: false, message: "Trainer not found" });
    res.json({ success: true, message: "Trainer updated successfully", trainer: updatedTrainer });
  } catch (error) {
    console.error("Error updating trainer:", error);
    res.status(500).json({ success: false, message: "Error updating trainer" });
  }
};

// ============================
// 🚀 DELETE TRAINER
// ============================
export const deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });
    res.json({ success: true, message: "Trainer deleted successfully!" });
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({ success: false, message: "Error deleting trainer" });
  }
};
