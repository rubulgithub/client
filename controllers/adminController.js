import userModels from "../models/userModels.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import notificationModel from "../models/notificationModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get All Users
export const getAllUsersController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }

  const users = await userModels
    .find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await userModels.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
      "Users retrieved successfully"
    )
  );
});

// Get All Doctors (Admin)
export const getAllDoctorsAdminController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { specialization: new RegExp(search, "i") },
    ];
  }

  const doctors = await doctorModel
    .find(query)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await doctorModel.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        doctors,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
      "Doctors retrieved successfully"
    )
  );
});

// Approve/Reject Doctor
export const updateDoctorStatusController = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  // Update doctor status
  doctor.status = status;
  await doctor.save();

  // Update user's doctor status
  const user = await userModels.findById(doctor.userId);
  if (user) {
    user.isDoctor = status === "approved";
    await user.save();
  }

  // Notify doctor
  await notificationModel.create({
    userId: doctor.userId,
    type: status === "approved" ? "doctor_approved" : "doctor_rejected",
    title: "Doctor Application Status",
    message: `Your doctor application has been ${status}`,
    data: {
      doctorId: doctor._id,
    },
    onClickPath: "/doctor/profile",
  });

  res
    .status(200)
    .json(new ApiResponse(200, doctor, `Doctor ${status} successfully`));
});

// Get Admin Dashboard Stats
export const getAdminDashboardController = asyncHandler(async (req, res) => {
  const totalUsers = await userModels.countDocuments();
  const totalDoctors = await doctorModel.countDocuments({ status: "approved" });
  const pendingDoctors = await doctorModel.countDocuments({
    status: "pending",
  });
  const totalAppointments = await appointmentModel.countDocuments();

  const today = moment().format("YYYY-MM-DD");
  const todayAppointments = await appointmentModel.countDocuments({
    date: today,
  });

  const appointmentStats = await appointmentModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const recentUsers = await userModels
    .find()
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(5);

  const recentDoctorApplications = await doctorModel
    .find({ status: "pending" })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        todayAppointments,
        appointmentStats,
        recentUsers,
        recentDoctorApplications,
      },
      "Admin dashboard data retrieved successfully"
    )
  );
});
