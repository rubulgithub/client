import express from "express";
import {
  getDoctorProfileController,
  updateDoctorProfileController,
  getDoctorAppointmentsController,
  updateAppointmentStatusController,
  getDoctorDashboardController,
} from "../controllers/doctorController.js";
import { requiredSignIn, isDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and doctor privileges
router.use(requiredSignIn);
router.use(isDoctor);

router.get("/profile", getDoctorProfileController);
router.patch("/profile", updateDoctorProfileController);
router.get("/appointments", getDoctorAppointmentsController);
router.patch(
  "/appointments/:appointmentId/status",
  updateAppointmentStatusController
);
router.get("/dashboard", getDoctorDashboardController);

export default router;
