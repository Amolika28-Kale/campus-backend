import express from "express";
import { login, signup } from "../controllers/authController.js";
import { upload } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", upload.single("collegeIdImage"), signup);
router.post("/login", login);

export default router;
