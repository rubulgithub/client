import userModels from "../models/userModels.js";
import doctorModel from "../models/doctorModel.js";
import notificationModel from "../models/notificationModel.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  registerSchema,
  loginSchema,
  doctorApplicationSchema,
} from "../utils/validationSchemas.js";
import emailService from "../utils/emailService.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Register Controller
export const registerController = asyncHandler(async (req, res) => {
  // Validate input
  const { error } = registerSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await userModels.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  // Create new user
  const user = await userModels.create({
    name,
    email,
    password,
    phone,
  });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(email, name);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  // Generate token
  const token = generateToken(user._id);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: { ...user._doc, password: undefined }, token },
        "User registered successfully"
      )
    );
});

// Login Controller
export const loginController = asyncHandler(async (req, res) => {
  // Validate input
  const { error } = loginSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { email, password } = req.body;

  // Find user and include password
  const user = await userModels.findOne({ email }).select("+password");

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: { ...user._doc, password: undefined }, token },
        "Login successful"
      )
    );
});

// Get Current User
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userModels.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User data retrieved successfully"));
});

// Apply for Doctor
export const applyDoctorController = asyncHandler(async (req, res) => {
  // Validate input
  const { error } = doctorApplicationSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  // Check if user already applied
  const existingApplication = await doctorModel.findOne({
    userId: req.user.id,
  });
  if (existingApplication) {
    throw new ApiError(400, "Doctor application already exists");
  }

  // Create doctor application
  const doctorApplication = await doctorModel.create({
    ...req.body,
    userId: req.user.id,
    status: "pending",
  });

  // Notify admin
  const adminUsers = await userModels.find({ isAdmin: true });

  const notifications = adminUsers.map((admin) => ({
    userId: admin._id,
    type: "doctor_application",
    title: "New Doctor Application",
    message: `${req.body.firstName} ${req.body.lastName} has applied for a doctor account`,
    data: {
      doctorId: doctorApplication._id,
      doctorName: `${req.body.firstName} ${req.body.lastName}`,
    },
    onClickPath: "/admin/doctors",
  }));

  await notificationModel.insertMany(notifications);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        doctorApplication,
        "Doctor application submitted successfully"
      )
    );
});

// Get All Doctors
export const getAllDoctorsController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, specialization, search } = req.query;

  // Build query
  const query = { status: "approved", isActive: true };

  if (specialization) {
    query.specialization = new RegExp(specialization, "i");
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
    .sort({ "rating.average": -1 })
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

// Get Doctor By ID
export const getDoctorByIdController = asyncHandler(async (req, res) => {
  const doctor = await doctorModel
    .findById(req.params.id)
    .populate("userId", "name email");

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, doctor, "Doctor retrieved successfully"));
});

export { generateToken };
