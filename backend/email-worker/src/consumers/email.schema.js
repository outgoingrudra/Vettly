
import { z } from "zod";

const emailAddress = z.string().email().max(254);
const emailName = z.string().trim().min(1).max(100);
const emailUrl = z.string().url().max(2048);

export const emailJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("welcome"),
    to: emailAddress,
    data: z.object({
      name: emailName,
    }).strict(),
  }).strict(),

  z.object({
    type: z.literal("verification"),
    to: emailAddress,
    data: z.object({
      name: emailName,
      verificationUrl: emailUrl,
      expiresIn: z.string().trim().min(1).max(50).default("30 minutes"),
    }).strict(),
  }).strict(),

  z.object({
    type: z.literal("password_reset"),
    to: emailAddress,
    data: z.object({
      name: emailName,
      resetUrl: emailUrl,
      expiresIn: z.string().trim().min(1).max(50).default("15 minutes"),
    }).strict(),
  }).strict(),
]);
