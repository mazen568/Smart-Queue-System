import { z } from "zod";

/**
 * Validation schema for taking a new ticket
 */
export const takeTicketSchema = z.object({
  clinicId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Clinic ID format"),
  queueId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Queue ID format"),
  customerName: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .optional(),
});

/**
 * Validation schema for fetching a single ticket/clinic by ID
 */
export const idParamSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid resource ID format"),
});
