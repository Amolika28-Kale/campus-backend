import User from "../models/User.js";
import College from "../models/College.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      gender,
      dob,
      college,
      password
    } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "College ID required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email exists" });

    const collegeDoc = await College.findById(college);
    if (!collegeDoc || collegeDoc.city !== "Pune")
      return res.status(400).json({ message: "Only Pune colleges allowed" });

    await User.create({
      fullName,
      email,
      phone,
      gender,
      dob,
      college,
      password,
      collegeIdImage: req.file.path
    });

    res.json({ message: "Signup successful. Awaiting approval." });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.status === "pending")
      return res.status(403).json({ message: "Account awaiting approval" });

    if (user.status === "banned")
      return res.status(403).json({ message: "Account banned" });

    if (user.status === "rejected")
      return res.status(403).json({ message: "Account rejected" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

   const token = jwt.sign(
  { id: user._id, role: "user" },
  process.env.JWT_SECRET,  // This should match exactly
  { expiresIn: "7d" }
);

res.json({
  token,
  user: {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
  }
});

  } catch (error) {
  console.log("LOGIN ERROR:", error);
  res.status(500).json({ message: error.message });
}

};
