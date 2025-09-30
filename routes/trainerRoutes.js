import express from "express";
import { 
  signupAndSendOtp, 
  loginAndSendOtp, 
  verifyOtp, 
  checkAuth, 
  logout, 
  getAllTrainers, 
  deleteTrainer 
} from "../controllers/trainerController.js";

const router = express.Router();

// POST /api/trainers/signup-otp
router.post("/signup-otp", signupAndSendOtp);

// POST /api/trainers/login-otp
router.post("/login-otp", loginAndSendOtp);

// POST /api/trainers/verify-otp
router.post("/verify-otp", verifyOtp);

// GET /api/trainers/check-auth
router.get("/check-auth", checkAuth);

// POST /api/trainers/logout
router.post("/logout", logout);

// GET /api/trainers
router.get("/", getAllTrainers);

// DELETE /api/trainers/:id
router.delete("/:id", deleteTrainer);

export default router;
