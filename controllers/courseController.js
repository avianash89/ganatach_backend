// controllers/courseController.js
import Course from "../models/Course.js";
import fs from "fs";

// ===============================
// 📚 GET ALL COURSES
// ===============================
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

// ===============================
// 📖 GET SINGLE COURSE BY ID
// ===============================
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    console.error("❌ Error fetching course:", err);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

// ===============================
// ➕ ADD NEW COURSE
// ===============================
export const addCourse = async (req, res) => {
  try {
    const { title, description, curriculum, whyChoose, aboutCourse } = req.body;

    let pdfUrl = null;
    if (req.file) {
      pdfUrl = `/uploads/${req.file.filename}`;
    }

    const parsedCurriculum = curriculum ? JSON.parse(curriculum) : [];
    const parsedWhyChoose = whyChoose ? JSON.parse(whyChoose) : [];

    const newCourse = new Course({
      title,
      description,
      pdfUrl,
      curriculum: parsedCurriculum,
      whyChoose: parsedWhyChoose,
      aboutCourse,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error("❌ Error adding course:", err);
    res.status(500).json({ error: "Failed to add course" });
  }
};

// ===============================
// ✏️ UPDATE COURSE
// ===============================
export const updateCourse = async (req, res) => {
  try {
    const { title, description, curriculum, whyChoose, aboutCourse } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Handle new file upload and delete old one
    if (req.file) {
      if (course.pdfUrl) {
        const oldPath = `.${course.pdfUrl}`;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      course.pdfUrl = `/uploads/${req.file.filename}`;
    }

    // Update text fields
    course.title = title || course.title;
    course.description = description || course.description;
    if (curriculum) course.curriculum = JSON.parse(curriculum);
    if (whyChoose) course.whyChoose = JSON.parse(whyChoose);
    if (aboutCourse) course.aboutCourse = aboutCourse;

    await course.save();
    res.json(course);
  } catch (err) {
    console.error("❌ Error updating course:", err);
    res.status(500).json({ error: "Failed to update course" });
  }
};

// ===============================
// 🗑️ DELETE COURSE
// ===============================
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Delete associated file if exists
    if (course.pdfUrl) {
      const filePath = `.${course.pdfUrl}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Course deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting course:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
};
