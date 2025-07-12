import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModels from "../models/userModels.js";
import notificationModel from "../models/notificationModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import moment from "moment";

// Get Doctor Profile
export const getDoctorProfileController = asyncHandler(async (req, res) => {
  const doctor = await doctorModel.findOne({ userId: req.user.id });

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, doctor, "Doctor profile retrieved successfully")
    );
});

// Update Doctor Profile
export const updateDoctorProfileController = asyncHandler(async (req, res) => {
  const allowedUpdates = [
    "firstName",
    "lastName",
    "phone",
    "website",
    "address",
    "specialization",
    "experience",
    "fees",
    "timings",
    "workingDays",
    "bio",
    "education",
  ];

  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const doctor = await doctorModel.findOneAndUpdate(
    { userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, doctor, "Doctor profile updated successfully"));
});

// Get Doctor Appointments
export const getDoctorAppointmentsController = asyncHandler(
  async (req, res) => {
    const { page = 1, limit = 10, status, date } = req.query;

    const doctor = await doctorModel.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const query = { doctorId: doctor._id, isDeleted: false };

    if (status) {
      query.status = status;
    }

    if (date) {
      query.date = moment(date).format("YYYY-MM-DD");
    }

    const appointments = await appointmentModel
      .find(query)
      .populate("userId", "name email phone")
      .sort({ date: 1, time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await appointmentModel.countDocuments(query);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          appointments,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
        },
        "Doctor appointments retrieved successfully"
      )
    );
  }
);

// Update Appointment Status
export const updateAppointmentStatusController = asyncHandler(
  async (req, res) => {
    const { appointmentId } = req.params;
    const { status, notes, prescription } = req.body;

    if (!["approved", "rejected", "completed"].includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const doctor = await doctorModel.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const appointment = await appointmentModel.findOne({
      _id: appointmentId,
      doctorId: doctor._id,
    });

    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    // Update appointment
    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (prescription) appointment.prescription = prescription;
    await appointment.save();

    // Notify patient
    const notificationMessages = {
      approved: "Your appointment has been approved",
      rejected: "Your appointment has been rejected",
      completed: "Your appointment has been completed",
    };

    await notificationModel.create({
      userId: appointment.userId,
      type: `appointment_${status}`,
      title: "Appointment Status Update",
      message: notificationMessages[status],
      data: {
        appointmentId: appointment._id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
      },
      onClickPath: "/user/appointments",
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          appointment,
          "Appointment status updated successfully"
        )
      );
  }
);

// Get Doctor Dashboard Stats
export const getDoctorDashboardController = asyncHandler(async (req, res) => {
  const doctor = await doctorModel.findOne({ userId: req.user.id });
  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const today = moment().format("YYYY-MM-DD");
  const thisMonth = moment().format("YYYY-MM");

  const stats = await appointmentModel.aggregate([
    { $match: { doctorId: doctor._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const todayAppointments = await appointmentModel.countDocuments({
    doctorId: doctor._id,
    date: today,
  });

  const thisMonthAppointments = await appointmentModel.countDocuments({
    doctorId: doctor._id,
    date: { $regex: `^${thisMonth}` },
  });

  const recentAppointments = await appointmentModel
    .find({ doctorId: doctor._id })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        stats,
        todayAppointments,
        thisMonthAppointments,
        recentAppointments,
      },
      "Doctor dashboard data retrieved successfully"
    )
  );
});
