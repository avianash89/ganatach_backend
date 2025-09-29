import Student from "../models/Student.js";
import twilio from "twilio";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// ✅ Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { name, mobile, course, email, message } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let student = await Student.findOne({ mobile });

    if (student) {
      student.otp = otp;
      student.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
      student.name = name;
      student.course = course;
      student.email = email;
      student.message = message;
    } else {
      student = new Student({
        name,
        mobile,
        course,
        email,
        message,
        otp,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000),
      });
    }

    await student.save();

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP for Student Enquiry is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${mobile}`,
    });

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// ✅ Verify OTP (with JWT and persistent cookie)
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, enteredOtp } = req.body;

    const student = await Student.findOne({ mobile });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.otp !== enteredOtp || student.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Clear OTP after verification
    student.otp = null;
    student.otpExpires = null;
    await student.save();

    // ✅ JWT Token create (persistent for 7 days)
    const token = jwt.sign(
      { id: student._id, mobile: student.mobile, name: student.name, course: student.course },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // persistent token for 7 days
    );

    // ✅ Set HTTP-only cookie
    res.cookie("student_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use HTTPS in prod
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "OTP Verified! Student Enquiry Submitted.",
      student: {
        id: student._id,
        name: student.name,
        mobile: student.mobile,
        course: student.course,
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
    const token = req.cookies?.student_token;
    if (!token) return res.status(401).json({ student: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ student: decoded });
  } catch (err) {
    console.error(err);
    res.status(401).json({ student: null });
  }
};

// ✅ Logout
export const logout = (req, res) => {
  res.clearCookie("student_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
};
