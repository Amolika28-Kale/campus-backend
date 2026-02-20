// routes/chatRoutes.js - Make sure it's correct
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markAsSeen,
  deleteMessage,
  clearChat
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:matchId", protect, getMessages);
router.put("/seen/:matchId", protect, markAsSeen);
router.delete("/message/:messageId", protect, deleteMessage); // 👈 This should be here
router.delete("/clear/:matchId", protect, clearChat);

export default router;