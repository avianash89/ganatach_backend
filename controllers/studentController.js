import Student from "../models/Student.js";
import twilio from "twilio";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// Temporary OTP store (in-memory, for demo; use Redis for production)
const otpStore = {};

// ============================
// 🚀 SIGNUP + SEND OTP (do NOT save student yet)
// ============================
export const signupAndSendOtp = async (req, res) => {
  try {
    const { name, mobile, email, course } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ mobile });
    if (existingStudent) {
      return res.status(200).json({
        success: false,
        message: "⚠️ Student already exists. Please login!",
        alreadyExists: true,
      });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP temporarily
    otpStore[mobile] = { name, mobile, email, course, otp, expires };

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP for Student Signup is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${mobile}`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent! Complete verification to submit form.",
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
    const { mobile } = req.body;

    const student = await Student.findOne({ mobile });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found. Please sign up!",
      });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    otpStore[mobile] = { otp, expires, isLogin: true };

    await client.messages.create({
      body: `Your OTP for Student Login is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${mobile}`,
    });

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Login OTP Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// ============================
// 🚀 VERIFY OTP & SAVE STUDENT (signup) OR LOGIN
// ============================
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, enteredOtp } = req.body;
    const tempData = otpStore[mobile];

    if (!tempData) {
      return res.status(400).json({ success: false, message: "OTP not requested or expired" });
    }

    if (tempData.otp !== enteredOtp || tempData.expires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    let student;
    // Signup verification
    if (!tempData.isLogin) {
      const { name, email, course } = tempData;
      student = new Student({ name, mobile, email, course });
      await student.save();
    } else {
      // Login verification
      student = await Student.findOne({ mobile });
    }

    // Remove OTP from temporary store
    delete otpStore[mobile];

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
      message: tempData.isLogin ? "✅ OTP Verified! Logged in successfully." : "✅ OTP Verified! Student registered successfully.",
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

// ============================
// 🚀 CHECK AUTH (login session)
// ============================
export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies?.student_token;
    if (!token) return res.status(401).json({ student: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ student: decoded });
  } catch (err) {
    console.error("CheckAuth Error:", err);
    res.status(401).json({ student: null });
  }
};

// ============================
// 🚀 GET ALL STUDENTS
// ============================
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

// ============================
// 🚀 GET SINGLE STUDENT
// ============================
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.status(200).json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ success: false, message: "Failed to fetch student" });
  }
};

// ============================
// 🚀 UPDATE STUDENT
// ============================
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedStudent) return res.status(404).json({ success: false, message: "Student not found" });

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ success: false, message: "Failed to update student" });
  }
};

// ============================
// 🚀 DELETE STUDENT
// ============================
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) return res.status(404).json({ success: false, message: "Student not found" });

    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ success: false, message: "Failed to delete student" });
  }
};

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
