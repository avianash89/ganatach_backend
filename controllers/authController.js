// import User from "../models/User.js";
// import twilio from "twilio";
// import dotenv from "dotenv";
// import jwt from "jsonwebtoken";
// dotenv.config();

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// // Send OTP
// export const sendOtp = async (req, res) => {
//   try {
//     const { mobile } = req.body;
//     if (!mobile || !/^\d{10}$/.test(mobile)) {
//       return res.status(400).json({ success: false, message: "Invalid mobile number" });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     let user = await User.findOne({ mobile });

//     if (user) {
//       user.otp = otp;
//       user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
//     } else {
//       user = new User({ mobile, otp, otpExpires: new Date(Date.now() + 5 * 60 * 1000) });
//     }

//     await user.save();

//     // Twilio
//     await client.messages.create({
//       body: `Your OTP is: ${otp}`,
//       from: process.env.TWILIO_PHONE,
//       to: `+91${mobile}`,
//     });

//     res.json({ success: true, message: "OTP sent successfully!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // Verify OTP
// export const verifyOtp = async (req, res) => {
//   try {
//     const { mobile, enteredOtp } = req.body;
//     if (!mobile || !enteredOtp) {
//       return res.status(400).json({ success: false, message: "Mobile & OTP required" });
//     }

//     const user = await User.findOne({ mobile });
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });
//     if (user.otp !== enteredOtp || user.otpExpires < new Date()) {
//       return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
//     }

//     user.otp = null;
//     user.otpExpires = null;
//     await user.save();

//     const token = jwt.sign({ id: user._id, mobile: user.mobile }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     res.cookie("token", token, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: false, // true if using HTTPS
//     });

//     res.json({ success: true, user: { id: user._id, mobile: user.mobile } });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // Check auth
// export const checkAuth = async (req, res) => {
//   try {
//     const token = req.cookies?.token;
//     if (!token) return res.status(401).json({ message: "Not authenticated" });
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     res.json({ user: decoded });
//   } catch {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// // Logout
// export const logout = (req, res) => {
//   res.clearCookie("token");
//   res.json({ success: true, message: "Logged out" });
// };
