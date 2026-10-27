
import prisma from "../../lib/prisma.js";
import { createInterviewSchema } from "./interview.schemas.js";

export async function createInterview(req, res) {
  const parsed = createInterviewSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid interview data.",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    // Adjust this if your requireAuth middleware uses a different property.
    const creatorId = req.user?.id;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      title,
      description,
      instructions,
      format,
      scheduledAt,
      durationMinutes,
      timezone,
      maxParticipants,
    } = parsed.data;

    const interview = await prisma.interview.create({
      data: {
        creatorId,
        title,
        description,
        instructions,
        format,
        scheduledAt,
        durationMinutes,
        timezone,
        maxParticipants,
        status: "DRAFT",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Interview created successfully.",
      data: { interview },
    });
  } catch (error) {
    console.error("Create interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create interview.",
    });
  }
}
