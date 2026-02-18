import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { reportUser } from "../controllers/reportController.js";

const router = express.Router();

router.post("/:userId", protect, reportUser);

export default router;
