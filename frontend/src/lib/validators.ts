/**
 * Zod validation schemas for all AgriNova forms
 */

import { z } from "zod";

// ==================== Registration Form ====================

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  taluka: z.string().optional(),
  soilType: z.enum([
    "BLACK_COTTON",
    "RED",
    "ALLUVIAL",
    "LATERITE",
    "SANDY",
  ]),
  irrigationType: z.enum(["DRIP", "FLOOD", "RAINFED", "SPRINKLER"]),
  landAreaAcres: z.coerce
    .number()
    .min(0.1, "Land area must be greater than 0")
    .max(10000, "Land area seems too large"),
  primaryCrop: z.string().optional(),
  gpsLat: z.coerce.number().min(-90).max(90).optional(),
  gpsLng: z.coerce.number().min(-180).max(180).optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ==================== Login Form ====================

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter a valid mobile number or email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==================== Soil Analysis Form ====================

export const soilAnalysisSchema = z.object({
  nitrogenN: z.coerce
    .number()
    .min(0, "Nitrogen cannot be negative")
    .max(1999, "Nitrogen value too high (0-1999 mg/kg)"),
  phosphorusP: z.coerce
    .number()
    .min(0, "Phosphorus cannot be negative")
    .max(1999, "Phosphorus value too high (0-1999 mg/kg)"),
  potassiumK: z.coerce
    .number()
    .min(0, "Potassium cannot be negative")
    .max(1999, "Potassium value too high (0-1999 mg/kg)"),
  ph: z.coerce
    .number()
    .min(0, "pH must be between 0 and 14")
    .max(14, "pH must be between 0 and 14"),
  moisture: z.coerce
    .number()
    .min(0, "Moisture must be between 0 and 100%")
    .max(100, "Moisture must be between 0 and 100%"),
  temperatureSoil: z.coerce
    .number()
    .min(-40, "Temperature too low")
    .max(80, "Temperature too high"),
  ec: z.coerce
    .number()
    .min(0, "EC cannot be negative")
    .max(10000, "EC value too high (0-10000 µS/cm)"),
  previousCrop: z.string().optional(),
  cropPlanted: z.boolean().default(false),
  plantedCropName: z.string().optional(),
  plantingDate: z.string().optional(),
});

export type SoilAnalysisFormData = z.infer<typeof soilAnalysisSchema>;

// ==================== Grievance Form ====================

export const grievanceSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(20, "Please provide a detailed description (min 20 chars)"),
});

export type GrievanceFormData = z.infer<typeof grievanceSchema>;

// ==================== Feedback Form ====================

export const feedbackSchema = z.object({
  followedRecommendation: z.boolean(),
  actualCropPlanted: z.string().optional(),
  outcomeRating: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
