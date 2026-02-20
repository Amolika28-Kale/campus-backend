// controllers/profileController.js - Complete updated file
import User from "../models/User.js";
import Block from "../models/Block.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Get My Profile
// controllers/profileController.js - Update getMyProfile
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("college", "name")
      .select("-password"); // Remove only password, keep all other fields
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format image URLs
    const userObj = user.toObject();
    if (userObj.profileImage) {
      userObj.profileImage = userObj.profileImage.replace(/\\/g, '/');
    }
    if (userObj.collegeIdImage) {
      userObj.collegeIdImage = userObj.collegeIdImage.replace(/\\/g, '/');
    }

    res.json(userObj);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Configure multer for profile photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

export const uploadProfilePhoto = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
}).single('profileImage');

// ✅ Update Profile Photo
export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    
    // Delete old profile photo if exists
    if (user.profileImage) {
      const oldPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new photo path
    user.profileImage = req.file.path;
    await user.save();

    res.json({ 
      message: "Profile photo updated successfully",
      profileImage: req.file.path 
    });

  } catch (error) {
    console.error("Update Profile Photo Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "fullName",
      "bio",
      "interests",
      "gender"
    ];

    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select("-password");

    res.json(user);

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Block User
export const blockUser = async (req, res) => {
  try {
    const existing = await Block.findOne({
      blocker: req.user._id,
      blocked: req.params.userId
    });

    if (existing)
      return res.json({ message: "Already blocked" });

    await Block.create({
      blocker: req.user._id,
      blocked: req.params.userId
    });

    res.json({ message: "User Blocked" });

  } catch (error) {
    console.error("Block Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Delete Account
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Delete profile photo if exists
    if (user.profileImage) {
      const photoPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};