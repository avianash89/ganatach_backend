import Student from "../models/Student.js";
import twilio from "twilio";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

//
// ============================
// 🚀 SIGNUP + SEND OTP
// ============================
export const signupAndSendOtp = async (req, res) => {
  try {
    const { name, mobile, email, course } = req.body;

    // ✅ Check if student already exists
    const existingStudent = await Student.findOne({ mobile });
    if (existingStudent) {
      // Student exists → just return a message, no OTP
      return res.status(200).json({
        success: false,
        message: "⚠️ Student already exists. Please login!",
        alreadyExists: true, // optional flag for frontend
      });
    }

    // ✅ Create new student
    const student = new Student({ name, mobile, email, course });

    // ✅ Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    student.otp = otp;
    student.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await student.save();

    // ✅ Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP for Student Signup is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${mobile}`,
    });

    res.status(200).json({
      success: true,
      message: "Student registered successfully! OTP sent.",
      alreadyExists: false,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};


//
// ============================
// 🚀 LOGIN + SEND OTP
// ============================
export const loginAndSendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    // Check if student exists
    let student = await Student.findOne({ mobile });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found. Please sign up!",
      });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    student.otp = otp;
    student.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await student.save();

    // Send OTP via SMS
    await client.messages.create({
      body: `Your OTP for Student Login is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${mobile}`,
    });

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

//
// ============================
// 🚀 VERIFY OTP (for both signup/login)
// ============================
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, enteredOtp } = req.body;

    const student = await Student.findOne({ mobile });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found. Please sign up!" });
    }

    if (student.otp !== enteredOtp || student.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    student.otp = null;
    student.otpExpires = null;
    await student.save();

    // Generate JWT
    const token = jwt.sign(
      { id: student._id, mobile: student.mobile, name: student.name, course: student.course },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("student_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "✅ OTP Verified! Student logged in.",
      student: {
        id: student._id,
        name: student.name,
        mobile: student.mobile,
        email: student.email,
        course: student.course,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};

//
// ============================
// 🚀 CHECK AUTH
// ============================
export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies?.student_token;
    if (!token) return res.status(401).json({ student: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ student: decoded });
  } catch (err) {
    console.error(err);
    res.status(401).json({ student: null });
  }
};

//
// ============================
// 🚀 LOGOUT
// ============================
export const logout = (req, res) => {
  res.clearCookie("student_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
};
