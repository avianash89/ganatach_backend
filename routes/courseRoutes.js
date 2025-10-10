// routes/courseRoutes.js
import express from "express";
import multer from "multer";
import {
  getCourses,
  getCourseById,
  addCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const router = express.Router();

// ===============================
// 📂 MULTER STORAGE CONFIGURATION
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

// ===============================
// 🧾 FILE FILTER (Only PDFs)
// ===============================
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

// ===============================
// 🚀 MULTER MIDDLEWARE
// ===============================
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// ===============================
// 🛣️ COURSE ROUTES
// ===============================
router.get("/", getCourses);                      // GET all courses
router.get("/:id", getCourseById);                // GET course by ID
router.post("/", upload.single("pdf"), addCourse); // POST new course with optional PDF
router.put("/:id", upload.single("pdf"), updateCourse); // PUT update course
router.delete("/:id", deleteCourse);              // DELETE course

export default router;
