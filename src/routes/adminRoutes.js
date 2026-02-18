import express from "express";
import * as adminController from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", adminController.adminLogin);

router.get("/dashboard", protect, isAdmin, adminController.dashboardStats);

router.get("/users", protect, isAdmin, adminController.getAllUsers);
router.put("/users/approve/:id", protect, isAdmin, adminController.approveUser);
router.put("/users/reject/:id", protect, isAdmin, adminController.rejectUser);
router.put("/users/ban/:id", protect, isAdmin, adminController.banUser);
router.delete("/users/:id", protect, isAdmin, adminController.deleteUser);

router.get("/reports", protect, isAdmin, adminController.getReports);
router.put("/reports/action/:id", protect, isAdmin, adminController.takeReportAction);

router.get("/chats/suspicious", protect, isAdmin, adminController.getSuspiciousChats);

router.post("/colleges", protect, isAdmin, adminController.addCollege);
router.get("/colleges", adminController.getColleges);
router.put("/colleges/:id", protect, isAdmin, adminController.updateCollege);
router.delete("/colleges/:id", protect, isAdmin, adminController.deleteCollege);

export default router;
