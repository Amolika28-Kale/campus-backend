import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    users: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "User",
  validate: [arr => arr.length === 2, "Match must contain exactly 2 users"]
}

  },
  { timestamps: true }
);

matchSchema.index({ users: 1 });
export default mongoose.model("Match", matchSchema);

