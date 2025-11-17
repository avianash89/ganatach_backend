import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

dotenv.config();

const app = express();
const allowedOrigins = [
  "https://ganatach2-0.vercel.app",
  "http://localhost:5173",
];   // deployed frontend URL in array

// ✅ Middlewares
app.use(
  cors({
    origin:allowedOrigins,
    credentials: true, // allow cookies
  })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());            // ✅ parse cookies
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/courses", courseRoutes);


// DB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.log(err.message));

// Server
const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);
