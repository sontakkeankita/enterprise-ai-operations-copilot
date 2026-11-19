
import { z } from "zod";

export const registerSchema = z.object({

  name: z.string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(60, "Name cannot exceed 60 characters"),

  email: z.string()
    .trim()
    .email("Please enter a valid email"),

  password: z.string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password is too long"),

  department: z.string()
    .trim()
    .max(60)
    .optional()

});

export const loginSchema = z.object({

  email: z.string()
  .trim()
  .email("Please enter a valid email")
  .transform((value) => value.toLowerCase()),

  password: z.string()
    .min(1, "Password is required")

});
