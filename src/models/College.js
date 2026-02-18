import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
name: {
  type: String,
  required: true,
  unique: true,
  trim: true
},

    city: {
      type: String,
      default: "Pune"
    }
  },
  { timestamps: true }
);

export default mongoose.model("College", collegeSchema);