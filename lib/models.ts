import mongoose, { Schema } from "mongoose";
const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["superadmin"], default: "superadmin" },
    active: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const certificateSchema = new Schema(
  {
    certificateNumber: { type: String, required: true, unique: true },
    candidateName: { type: String, required: true },
    examNumber: { type: String, required: true },
    examCenter: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    isVerified: { type: Boolean, required: true },
    examDate: { type: String, required: true },
    issuedDate: { type: String, required: true },
    certificateType: {
      type: String,
      enum: [
        "First School Leaving Certificate",
        "Basic Education Certificate",
        "University",
        "Polytechnic",
        "College of Education",
      ],
      required: true,
    },
    institution: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true },
);
const limitSchema = new Schema({
  _id: String,
  count: Number,
  expiresAt: { type: Date, index: { expires: 0 } },
});
export const Admin =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export const Certificate =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", certificateSchema);
export const RateLimit =
  mongoose.models.RateLimit || mongoose.model("RateLimit", limitSchema);
