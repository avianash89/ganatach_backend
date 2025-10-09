import express from "express";
import {
  signupAndSendOtp,
  loginAndSendOtp,
  verifyOtp,
  checkAuth,
  logout,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

const router = express.Router();

// ============================
// OTP & Auth routes
// ============================
router.post("/signup-otp", signupAndSendOtp);
router.post("/login-otp", loginAndSendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/check-auth", checkAuth);
router.post("/logout", logout);

// ============================
// Admin CRUD routes for students
// ============================
router.get("/", getAllStudents);          // GET all students
router.get("/:id", getStudentById);       // GET a single student
router.put("/:id", updateStudent);        // UPDATE student
router.delete("/:id", deleteStudent);     // DELETE student

export default router;
