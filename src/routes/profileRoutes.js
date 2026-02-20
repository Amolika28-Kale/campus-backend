// routes/profileRoutes.js - Add this route
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  updateProfile,
  updateProfilePhoto,
  blockUser,
  changePassword,
  deleteAccount,
  uploadProfilePhoto,
  getMyProfile
} from "../controllers/profileController.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/profile/me - Get current user profile
router.get("/me", protect, getMyProfile);

// GET /api/profile/:userId - Get other user profile
// controllers/profileController.js - Add image URL formatting
// Update the get other user profile route
router.get("/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("college", "name")
      .select("-password -role -status -warningCount");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Format image URL
    const userObj = user.toObject();
    if (userObj.profileImage) {
      userObj.profileImage = userObj.profileImage.replace(/\\/g, '/');
    }
    
    res.json(userObj);
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/update", protect, updateProfile);
router.put("/update-photo", protect, uploadProfilePhoto, updateProfilePhoto);
router.post("/block/:userId", protect, blockUser);
router.put("/change-password", protect, changePassword);
router.delete("/delete", protect, deleteAccount);

export default router;