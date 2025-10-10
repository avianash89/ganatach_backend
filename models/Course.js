import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  objective: { type: String },
  topics: [String],
  labs: [String],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pdfUrl: { type: String },

    // ✅ New fields
    whyChoose: [
      {
        title: { type: String },
        content: { type: String },
      },
    ],
    aboutCourse: { type: String },

    curriculum: [moduleSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
