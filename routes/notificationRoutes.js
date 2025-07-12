import express from "express";
import {
  getUserNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController,
  clearAllNotificationsController,
} from "../controllers/notificationController.js";
import { requiredSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(requiredSignIn);

router.get("/", getUserNotificationsController);
router.patch("/:notificationId/read", markNotificationReadController);
router.patch("/read-all", markAllNotificationsReadController);
router.delete("/:notificationId", deleteNotificationController);
router.delete("/clear-all", clearAllNotificationsController);

export default router;
