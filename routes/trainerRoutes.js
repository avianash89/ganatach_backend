import express from "express";
import { 
  signupAndSendOtp, 
  loginAndSendOtp, 
  verifyOtp, 
  checkAuth, 
  logout, 
  getAllTrainers, 
  getTrainerById,
  updateTrainer,
  deleteTrainer
} from "../controllers/trainerController.js";

const router = express.Router();

// OTP & Auth Routes
router.post("/signup-otp", signupAndSendOtp);
router.post("/login-otp", loginAndSendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/check-auth", checkAuth);
router.post("/logout", logout);

// Admin / CRUD Routes
router.get("/", getAllTrainers);            // Get all trainers
router.get("/:id", getTrainerById);         // Get single trainer
router.put("/:id", updateTrainer);          // Update trainer
router.delete("/:id", deleteTrainer);       // Delete trainer

export default router;
