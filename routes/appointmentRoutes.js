import express from "express";
import {
  bookAppointmentController,
  checkAvailabilityController,
  getUserAppointmentsController,
  cancelAppointmentController,
  rescheduleAppointmentController,
} from "../controllers/appointmentController.js";
import { requiredSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(requiredSignIn);

router.post("/book", bookAppointmentController);
router.post("/check-availability", checkAvailabilityController);
router.get("/user", getUserAppointmentsController);
router.patch("/:appointmentId/cancel", cancelAppointmentController);
router.patch("/:appointmentId/reschedule", rescheduleAppointmentController);

export default router;
