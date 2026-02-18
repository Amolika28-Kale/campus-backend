import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reported: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
  type: String,
  enum: ["pending", "resolved"],
  default: "pending"
}

  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, reported: 1 });

export default mongoose.model("Report", reportSchema);

