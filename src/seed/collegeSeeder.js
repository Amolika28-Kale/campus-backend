import mongoose from "mongoose";
import dotenv from "dotenv";
import College from "../models/College.js";

dotenv.config();

const puneColleges = [
  { name: "COEP Technological University", city: "Pune", state: "Maharashtra" },
  { name: "MIT World Peace University", city: "Pune", state: "Maharashtra" },
  { name: "Savitribai Phule Pune University (SPPU)", city: "Pune", state: "Maharashtra" },
  { name: "Vishwakarma Institute of Technology (VIT)", city: "Pune", state: "Maharashtra" },
  { name: "DY Patil College of Engineering, Akurdi", city: "Pune", state: "Maharashtra" },
  { name: "Pimpri Chinchwad College of Engineering (PCCOE)", city: "Pune", state: "Maharashtra" },
  { name: "Modern College of Arts, Science and Commerce", city: "Pune", state: "Maharashtra" },
  { name: "Fergusson College", city: "Pune", state: "Maharashtra" },
  { name: "Sinhgad College of Engineering", city: "Pune", state: "Maharashtra" },
  { name: "Bharati Vidyapeeth Deemed University", city: "Pune", state: "Maharashtra" },
  { name: "Army Institute of Technology", city: "Pune", state: "Maharashtra" },
  { name: "Symbiosis International University", city: "Pune", state: "Maharashtra" },
  { name: "Symbiosis Institute of Technology", city: "Pune", state: "Maharashtra" },
  { name: "Indira College of Engineering & Management", city: "Pune", state: "Maharashtra" },
  { name: "Marathwada Mitra Mandal's College of Engineering (MMCOE)", city: "Pune", state: "Maharashtra" },
];

const seedColleges = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    // Upsert logic (duplicate avoid)
    for (let college of puneColleges) {
      await College.updateOne(
        { name: college.name },
        college,
        { upsert: true }
      );
    }

    console.log("Pune Colleges Seeded Successfully 🌱🔥");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedColleges();
