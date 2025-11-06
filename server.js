import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import studentRoutes from "./routes/studentRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

dotenv.config();
const app = express();

// ✅ allow both localhost and deployed frontend
const allowedOrigins = [
  "https://ganatach2-0.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/courses", courseRoutes);

// ✅ DB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.log("MongoDB Error:", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
