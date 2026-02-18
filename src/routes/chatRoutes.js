import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markAsSeen
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:matchId", protect, getMessages);
router.put("/seen/:matchId", protect, markAsSeen);

export default router;
