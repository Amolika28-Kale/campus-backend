import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  likeUser,
  getMyMatches,
  unmatchUser
} from "../controllers/matchController.js";

const router = express.Router();

router.post("/like/:userId", protect, likeUser);
router.get("/", protect, getMyMatches);
router.delete("/unmatch/:matchId", protect, unmatchUser);

export default router;