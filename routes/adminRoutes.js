import express from "express";
import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.post("/login", loginAdmin);

// Protected route
router.get("/me", protectAdmin, getAdminProfile);

export default router;
