import express from "express";
import {
  registerController,
  loginController,
  getCurrentUser,
  applyDoctorController,
  getAllDoctorsController,
  getDoctorByIdController,
} from "../controllers/userController.js";
import { requiredSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/doctors", getAllDoctorsController);
router.get("/doctors/:id", getDoctorByIdController);

// Protected routes
router.get("/profile", requiredSignIn, getCurrentUser);
router.post("/apply-doctor", requiredSignIn, applyDoctorController);

export default router;
