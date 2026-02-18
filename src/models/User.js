import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: String,

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
      lowercase: true
    },

    dob: { type: Date, required: true },

    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true
    },

    collegeIdImage: { type: String, required: true },

    profileImage: String,
    bio: String,
    interests: { type: [String], default: [] },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    status: {
      type: String,
      enum: ["pending", "active", "banned", "suspended", "rejected"],
      default: "pending"
    },

    role: {
      type: String,
      default: "user"
    },

    warningCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

/* Hash Password */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* Age 18+ Validation */
userSchema.pre("save", function (next) {
  const age = new Date().getFullYear() - this.dob.getFullYear();
  if (age < 18) return next(new Error("User must be 18+"));
  next();
});

export default mongoose.model("User", userSchema);
