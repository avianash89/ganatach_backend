import express from "express";
import { sendOtp, verifyOtp, checkAuth, logout, getAllTrainers, deleteTrainer } from "../controllers/trainerController.js";

const router = express.Router();

// POST /api/trainers/send-otp
router.post("/send-otp", sendOtp);

// POST /api/trainers/verify-otp
router.post("/verify-otp", verifyOtp);

// GET /api/trainers/check-auth ✅
router.get("/check-auth", checkAuth);

// POST /api/trainers/logout ✅
router.post("/logout", logout);

// GET /api/trainers
router.get("/", getAllTrainers);

// DELETE /api/trainers/:id
router.delete("/:id", deleteTrainer);

export default router;

