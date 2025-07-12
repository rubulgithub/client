import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModels from "../models/userModels.js";
import notificationModel from "../models/notificationModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { appointmentSchema } from "../utils/validationSchemas.js";
import moment from "moment";
import emailService from "../utils/emailService.js";

// Book Appointment
export const bookAppointmentController = asyncHandler(async (req, res) => {
  // Validate input
  const { error } = appointmentSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { doctorId, date, time, symptoms, duration = 30 } = req.body;

  // Check if doctor exists and is approved
  const doctor = await doctorModel.findById(doctorId).populate("userId");
  if (!doctor || doctor.status !== "approved") {
    throw new ApiError(404, "Doctor not found or not approved");
  }

  // Check appointment availability
  const appointmentDate = moment(date).format("YYYY-MM-DD");
  const appointmentTime = moment(time, "HH:mm").format("HH:mm");

  const existingAppointment = await appointmentModel.findOne({
    doctorId,
    date: appointmentDate,
    time: appointmentTime,
    status: { $in: ["pending", "approved"] },
  });

  if (existingAppointment) {
    throw new ApiError(400, "Appointment slot not available");
  }

  // Create appointment
  const appointment = await appointmentModel.create({
    userId: req.user.id,
    doctorId,
    date: appointmentDate,
    time: appointmentTime,
    duration,
    symptoms,
    fees: doctor.fees,
  });

  // Notify doctor
  await notificationModel.create({
    userId: doctor.userId._id,
    type: "appointment_request",
    title: "New Appointment Request",
    message: `You have a new appointment request for ${moment(date).format(
      "DD-MM-YYYY"
    )} at ${time}`,
    data: {
      appointmentId: appointment._id,
      patientName: req.user.name,
    },
    onClickPath: "/doctor/appointments",
  });

  // Get user details for email
  const user = await userModels.findById(req.user.id);

  // Send confirmation email
  try {
    await emailService.sendAppointmentConfirmation(user.email, {
      date: moment(date).format("DD-MM-YYYY"),
      time,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
    });
  } catch (error) {
    console.error("Failed to send appointment confirmation email:", error);
  }

  res
    .status(201)
    .json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

// Check Appointment Availability
export const checkAvailabilityController = asyncHandler(async (req, res) => {
  const { doctorId, date, time } = req.body;

  if (!doctorId || !date || !time) {
    throw new ApiError(400, "Doctor ID, date, and time are required");
  }

  const appointmentDate = moment(date).format("YYYY-MM-DD");
  const appointmentTime = moment(time, "HH:mm").format("HH:mm");

  const existingAppointment = await appointmentModel.findOne({
    doctorId,
    date: appointmentDate,
    time: appointmentTime,
    status: { $in: ["pending", "approved"] },
  });

  const isAvailable = !existingAppointment;

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAvailable },
        isAvailable ? "Slot available" : "Slot not available"
      )
    );
});

// Get User Appointments
export const getUserAppointmentsController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { userId: req.user.id, isDeleted: false };

  if (status) {
    query.status = status;
  }

  const appointments = await appointmentModel
    .find(query)
    .populate("doctorId", "firstName lastName specialization")
    .sort({ date: -1, time: -1 })
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
      "Appointments retrieved successfully"
    )
  );
});

// Cancel Appointment
export const cancelAppointmentController = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;

  const appointment = await appointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.userId.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to cancel this appointment");
  }

  if (
    appointment.status === "completed" ||
    appointment.status === "cancelled"
  ) {
    throw new ApiError(
      400,
      "Cannot cancel completed or already cancelled appointment"
    );
  }

  // Update appointment
  appointment.status = "cancelled";
  appointment.cancelReason = reason;
  appointment.cancelledBy = req.user.id;
  appointment.cancelledAt = new Date();
  await appointment.save();

  // Notify doctor
  const doctor = await doctorModel.findById(appointment.doctorId);
  await notificationModel.create({
    userId: doctor.userId,
    type: "appointment_cancelled",
    title: "Appointment Cancelled",
    message: `Appointment for ${moment(appointment.date).format(
      "DD-MM-YYYY"
    )} at ${appointment.time} has been cancelled`,
    data: {
      appointmentId: appointment._id,
      reason,
    },
    onClickPath: "/doctor/appointments",
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, appointment, "Appointment cancelled successfully")
    );
});

// Reschedule Appointment
export const rescheduleAppointmentController = asyncHandler(
  async (req, res) => {
    const { appointmentId } = req.params;
    const { date, time } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.userId.toString() !== req.user.id) {
      throw new ApiError(403, "Not authorized to reschedule this appointment");
    }

    if (appointment.status !== "pending") {
      throw new ApiError(400, "Only pending appointments can be rescheduled");
    }

    // Check new slot availability
    const newDate = moment(date).format("YYYY-MM-DD");
    const newTime = moment(time, "HH:mm").format("HH:mm");

    const conflictingAppointment = await appointmentModel.findOne({
      doctorId: appointment.doctorId,
      date: newDate,
      time: newTime,
      status: { $in: ["pending", "approved"] },
      _id: { $ne: appointmentId },
    });

    if (conflictingAppointment) {
      throw new ApiError(400, "New slot not available");
    }

    // Update appointment
    appointment.date = newDate;
    appointment.time = newTime;
    await appointment.save();

    // Notify doctor
    const doctor = await doctorModel.findById(appointment.doctorId);
    await notificationModel.create({
      userId: doctor.userId,
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `Appointment has been rescheduled to ${moment(date).format(
        "DD-MM-YYYY"
      )} at ${time}`,
      data: {
        appointmentId: appointment._id,
      },
      onClickPath: "/doctor/appointments",
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          appointment,
          "Appointment rescheduled successfully"
        )
      );
  }
);
