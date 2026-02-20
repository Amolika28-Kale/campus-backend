// models/Message.js - Updated with deletedBy array
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    matchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Match", 
      required: true 
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      required: true, 
      trim: true 
    },
    seen: {
      type: Boolean,
      default: false
    },
    // ✅ NEW: Track which users have deleted this message
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);