
import { z } from "zod";

export const createInterviewSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(5000).optional(),
  instructions: z.string().trim().max(10000).optional(),
  format: z.enum(["LIVE", "ASYNC"]).default("LIVE"),
  scheduledAt: z.coerce.date().optional(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  timezone: z.string().trim().min(1).max(100).default("UTC"),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
});
