import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const doctorApplicationSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  website: Joi.string().uri().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  specialization: Joi.string().required(),
  experience: Joi.number().min(0).required(),
  fees: Joi.number().min(0).required(),
  timings: Joi.object({
    start: Joi.string().required(),
    end: Joi.string().required(),
  }).required(),
  workingDays: Joi.array()
    .items(
      Joi.string().valid(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      )
    )
    .optional(),
  bio: Joi.string().max(500).optional(),
  education: Joi.array()
    .items(
      Joi.object({
        degree: Joi.string().optional(),
        institution: Joi.string().optional(),
        year: Joi.number().optional(),
      })
    )
    .optional(),
});

export const appointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.date().min("now").required(),
  time: Joi.string().required(),
  symptoms: Joi.string().max(500).optional(),
  duration: Joi.number().min(15).max(120).optional(),
});
