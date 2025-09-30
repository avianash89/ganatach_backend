import express from "express";
import { signupAndSendOtp, loginAndSendOtp, verifyOtp, checkAuth, logout } from "../controllers/studentController.js";

const router = express.Router();

// POST /api/students/signup-otp
router.post("/signup-otp", signupAndSendOtp);

// POST /api/students/login-otp
router.post("/login-otp", loginAndSendOtp);

// POST /api/students/verify-otp
router.post("/verify-otp", verifyOtp);

// GET /api/students/check-auth
router.get("/check-auth", checkAuth);

// POST /api/students/logout
router.post("/logout", logout);

export default router;

