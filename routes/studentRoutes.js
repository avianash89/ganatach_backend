import express from "express";
import { sendOtp, verifyOtp, checkAuth, logout } from "../controllers/studentController.js";

const router = express.Router();

// POST /api/students/send-otp
router.post("/send-otp", sendOtp);

// POST /api/students/verify-otp
router.post("/verify-otp", verifyOtp);

// GET /api/students/check-auth ✅
router.get("/check-auth", checkAuth);

// POST /api/students/logout
router.post("/logout", logout);

export default router;
