import express from "express";
import {
  getAllUsersController,
  getAllDoctorsAdminController,
  updateDoctorStatusController,
  getAdminDashboardController,
} from "../controllers/adminController.js";
import { requiredSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(requiredSignIn);
router.use(isAdmin);

router.get("/users", getAllUsersController);
router.get("/doctors", getAllDoctorsAdminController);
router.patch("/doctors/:doctorId/status", updateDoctorStatusController);
router.get("/dashboard", getAdminDashboardController);

export default router;
