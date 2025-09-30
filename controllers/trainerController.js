import Trainer from "../models/Trainer.js";
import twilio from "twilio";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// ✅ Send OTP (only for registered trainers)
export const sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Check if trainer exists
    let trainer = await Trainer.findOne({ phoneNumber });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found. Please sign up!",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    trainer.otp = otp;
    trainer.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    await trainer.save();

    // Send OTP via SMS
    await client.messages.create({
      body: `Your OTP for Trainer Login is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${phoneNumber}`,
    });

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// ✅ Verify OTP and issue JWT
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, enteredOtp } = req.body;

    const trainer = await Trainer.findOne({ phoneNumber });

    if (!trainer) {
      return res.status(404).json({ success: false, message: "Trainer not found. Please sign up!" });
    }

    if (trainer.otp !== enteredOtp || trainer.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    trainer.otp = null;
    trainer.otpExpires = null;
    await trainer.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: trainer._id,
        phoneNumber: trainer.phoneNumber,
        trainerName: trainer.trainerName,
        technology: trainer.technology,
      },
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
      message: "OTP Verified! Trainer logged in.",
      trainer: {
        id: trainer._id,
        name: trainer.trainerName,
        phoneNumber: trainer.phoneNumber,
        technology: trainer.technology,
        experience: trainer.experience,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};

// ✅ Check Auth
export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies?.trainer_token;
    if (!token) return res.status(401).json({ trainer: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ trainer: decoded });
  } catch (err) {
    console.error(err);
    res.status(401).json({ trainer: null });
  }
};

// ✅ Logout
export const logout = (req, res) => {
  res.clearCookie("trainer_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// ✅ Get all trainers
export const getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find();
    res.status(200).json(trainers);
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ success: false, message: "Error fetching trainers" });
  }
};

// ✅ Delete trainer
export const deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = await Trainer.findByIdAndDelete(id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: "Trainer not found" });
    }
    res.json({ success: true, message: "Trainer deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting trainer" });
  }
};
