// routes/profileRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  updateProfile,
  updateProfilePhoto,
  blockUser,
  changePassword,
  deleteAccount,
  uploadProfilePhoto,
  getMyProfile // 👈 हे import करा
} from "../controllers/profileController.js";

const router = express.Router();

// GET /api/profile/me - Get current user profile
router.get("/me", protect, getMyProfile);

router.put("/update", protect, updateProfile);
router.put("/update-photo", protect, uploadProfilePhoto, updateProfilePhoto);
router.post("/block/:userId", protect, blockUser);
router.put("/change-password", protect, changePassword);
router.delete("/delete", protect, deleteAccount);

export default router;