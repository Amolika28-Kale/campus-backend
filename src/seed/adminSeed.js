import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for Seeding");

    const email = process.env.ADMIN_EMAIL || "admin@campus.com";
    const password = process.env.ADMIN_PASSWORD || "Admin@123";
    const name = process.env.ADMIN_NAME || "Super Admin";

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    console.log("🚀 Admin Created Successfully");
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
