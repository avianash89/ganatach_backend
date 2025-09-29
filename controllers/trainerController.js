import Trainer from "../models/Trainer.js";
import twilio from "twilio";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// ✅ Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { trainerName, phoneNumber, email, technology, experience } = req.body;

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let trainer = await Trainer.findOne({ phoneNumber });

    if (trainer) {
      trainer.otp = otp;
      trainer.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
      trainer.trainerName = trainerName;
      trainer.email = email;
      trainer.technology = technology;
      trainer.experience = experience;
    } else {
      trainer = new Trainer({
        trainerName,
        phoneNumber,
        email,
        technology,
        experience,
        otp,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000),
      });
    }

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

// ✅ Verify OTP and issue JWT for persistent login
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, enteredOtp } = req.body;

    const trainer = await Trainer.findOne({ phoneNumber });

    if (!trainer) {
      return res.status(404).json({ success: false, message: "Trainer not found" });
    }

    if (trainer.otp !== enteredOtp || trainer.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    trainer.otp = null;
    trainer.otpExpires = null;
    await trainer.save();

    // ✅ Generate JWT token (7 days)
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

    // ✅ Set HTTP-only cookie
    res.cookie("trainer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

// ✅ Check Auth (persistent login)
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

// ✅ Delete trainer by ID
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
