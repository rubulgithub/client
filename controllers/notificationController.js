import notificationModel from "../models/notificationModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get User Notifications
export const getUserNotificationsController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const notifications = await notificationModel
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await notificationModel.countDocuments({ userId: req.user.id });
  const unreadCount = await notificationModel.countDocuments({
    userId: req.user.id,
    isRead: false,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        unreadCount,
      },
      "Notifications retrieved successfully"
    )
  );
});

// Mark Notification as Read
export const markNotificationReadController = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await notificationModel.findOneAndUpdate(
    { _id: notificationId, userId: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark All Notifications as Read
export const markAllNotificationsReadController = asyncHandler(
  async (req, res) => {
    await notificationModel.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, null, "All notifications marked as read"));
  }
);

// Delete Notification
export const deleteNotificationController = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await notificationModel.findOneAndDelete({
    _id: notificationId,
    userId: req.user.id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});

// Clear All Notifications
export const clearAllNotificationsController = asyncHandler(
  async (req, res) => {
    await notificationModel.deleteMany({ userId: req.user.id });

    res
      .status(200)
      .json(new ApiResponse(200, null, "All notifications cleared"));
  }
);
