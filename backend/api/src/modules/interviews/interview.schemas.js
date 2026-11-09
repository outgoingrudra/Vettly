
import { z } from "zod";

export const createInterviewSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(5000).optional(),
  instructions: z.string().trim().max(10000).optional(),
  format: z.enum(["LIVE", "ASYNC"]).default("LIVE"),
  scheduledAt: z.coerce.date().nullable().optional(),
  durationMinutes: z.number().int().min(1).max(525600).default(30),
  preventCopyPasteEnabled: z.boolean().optional(),
  tabSwitchDetectionEnabled: z.boolean().optional(),
  fullscreenRequired: z.boolean().optional(),
  faceDetectionEnabled: z.boolean().optional(),
  multipleFaceDetectionEnabled: z.boolean().optional(),
  suspiciousGestureDetectionEnabled: z.boolean().optional(),
  cameraDisconnectDetectionEnabled: z.boolean().optional(),
  warningLimit: z.number().int().min(1).max(1000).default(3),
  timezone: z.string().trim().min(1).max(100).default("UTC"),
  maxParticipants: z.number().int().min(1).max(1000).nullable().optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(32).max(200),
});



export const createProctoringEventSchema = z.object({
  type: z.enum([
    "COPY_ATTEMPT",
    "CUT_ATTEMPT",
    "PASTE_ATTEMPT",
    "TAB_SWITCH",
    "FULLSCREEN_EXIT",
    "FACE_MISSING",
    "MULTIPLE_FACES",
    "SUSPICIOUS_GESTURE",
    "CAMERA_DISCONNECTED",
    "LOOKING_AWAY",
  ]),
  occurredAt: z.coerce.date().optional(),
  durationMs: z.number().int().min(0).max(3600000).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});
