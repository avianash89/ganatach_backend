import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
    trainerName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    technology: { type: String, required: true },
    experience: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
}, { timestamps: true });

export default mongoose.model("Trainer", trainerSchema);
