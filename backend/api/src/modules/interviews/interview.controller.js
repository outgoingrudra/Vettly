import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

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


export async function listMyInterviews(req, res) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const status = req.query.status;

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters.",
    });
  }

  const allowedStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid interview status.",
    });
  }

  try {
    const creatorId = req.user?.id;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const where = {
      creatorId,
      ...(status ? { status } : {}),
    };

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.interview.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        interviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("List interviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve interviews.",
    });
  }
}



export async function getInterviewById(req, res) {
  try {
    const creatorId = req.user?.id;
    const { id } = req.params;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID.",
      });
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        creatorId,
      },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { interview },
    });
  } catch (error) {
    console.error("Get interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve interview.",
    });
  }
}



export async function updateInterview(req, res) {
  const parsed = createInterviewSchema.partial().safeParse(req.body);

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

  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one field to update.",
    });
  }

  try {
    const creatorId = req.user?.id;
    const { id } = req.params;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const existingInterview = await prisma.interview.findFirst({
      where: { id, creatorId },
      select: { id: true, status: true },
    });

    if (!existingInterview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    if (existingInterview.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Only draft interviews can be edited.",
      });
    }

    const interview = await prisma.interview.update({
      where: { id },
      data: parsed.data,
    });

    return res.status(200).json({
      success: true,
      message: "Interview updated successfully.",
      data: { interview },
    });
  } catch (error) {
    console.error("Update interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update interview.",
    });
  }
}



export async function publishInterview(req, res) {
  try {
    const creatorId = req.user?.id;
    const { id } = req.params;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const interview = await prisma.interview.findFirst({
      where: { id, creatorId },
      select: { id: true, status: true },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    if (interview.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Only draft interviews can be published.",
      });
    }

    const publishedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Interview published successfully.",
      data: { interview: publishedInterview },
    });
  } catch (error) {
    console.error("Publish interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to publish interview.",
    });
  }
}



export async function archiveInterview(req, res) {
  try {
    const creatorId = req.user?.id;
    const { id } = req.params;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const interview = await prisma.interview.findFirst({
      where: { id, creatorId },
      select: { id: true, status: true },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    if (interview.status === "ARCHIVED") {
      return res.status(409).json({
        success: false,
        message: "Interview is already archived.",
      });
    }

    const archivedInterview = await prisma.interview.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return res.status(200).json({
      success: true,
      message: "Interview archived successfully.",
      data: { interview: archivedInterview },
    });
  } catch (error) {
    console.error("Archive interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to archive interview.",
    });
  }
}



export async function deleteInterview(req, res) {
  try {
    const creatorId = req.user?.id;
    const { id } = req.params;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const interview = await prisma.interview.findFirst({
      where: { id, creatorId },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            participants: true,
            attempts: true,
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    if (interview.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Only draft interviews can be deleted.",
      });
    }

    if (
      interview._count.participants > 0 ||
      interview._count.attempts > 0
    ) {
      return res.status(409).json({
        success: false,
        message: "Interview with participants or attempts cannot be deleted.",
      });
    }

    // Scope the deletion to the owner and draft status.
    const result = await prisma.interview.deleteMany({
      where: {
        id,
        creatorId,
        status: "DRAFT",
        participants: { none: {} },
        attempts: { none: {} },
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Interview changed or can no longer be deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview deleted successfully.",
    });
  } catch (error) {
    console.error("Delete interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete interview.",
    });
  }
}



const inviteParticipantSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function inviteParticipant(req, res) {
  const parsed = inviteParticipantSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "A valid email address is required.",
    });
  }

  try {
    const creatorId = req.user?.id;
    const { id: interviewId } = req.params;
    const email = parsed.data.email.toLowerCase();

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        creatorId,
      },
      select: {
        id: true,
        status: true,
        maxParticipants: true,
      },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    if (interview.status !== "PUBLISHED") {
      return res.status(409).json({
        success: false,
        message: "Only published interviews can accept invitations.",
      });
    }

    const existingParticipant =
      await prisma.interviewParticipant.findUnique({
        where: {
          interviewId_email: {
            interviewId,
            email,
          },
        },
        select: { id: true },
      });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: "This email has already been invited.",
      });
    }

    if (interview.maxParticipants !== null) {
      const participantCount =
        await prisma.interviewParticipant.count({
          where: { interviewId },
        });

      if (participantCount >= interview.maxParticipants) {
        return res.status(409).json({
          success: false,
          message: "Interview participant limit reached.",
        });
      }
    }

    const rawToken = randomBytes(32).toString("base64url");
    const invitationTokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const invitationExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const participant = await prisma.interviewParticipant.create({
      data: {
        interviewId,
        email,
        status: "INVITED",
        invitationTokenHash,
        invitationExpiresAt,
      },
      select: {
        id: true,
        interviewId: true,
        email: true,
        status: true,
        invitedAt: true,
        invitationExpiresAt: true,
      },
    });

    // Email delivery will be connected when the worker supports
    // participant_invitation jobs. Never return the raw token here.

    return res.status(201).json({
      success: true,
      message:
        "Participant invitation created. Email delivery is not enabled yet.",
      data: { participant },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This email has already been invited.",
      });
    }

    console.error("Invite participant error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create participant invitation.",
    });
  }
}


export async function listInterviewParticipants(req, res) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const status = req.query.status;

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters.",
    });
  }

  const allowedStatuses = [
    "INVITED",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "DECLINED",
    "EXPIRED",
  ];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid participant status.",
    });
  }

  try {
    const creatorId = req.user?.id;
    const { id: interviewId } = req.params;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, creatorId },
      select: { id: true },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    const where = {
      interviewId,
      ...(status ? { status } : {}),
    };

    const [participants, total] = await Promise.all([
      prisma.interviewParticipant.findMany({
        where,
        select: {
          id: true,
          email: true,
          userId: true,
          status: true,
          invitedAt: true,
          invitationExpiresAt: true,
          acceptedAt: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.interviewParticipant.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        participants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("List interview participants error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve participants.",
    });
  }
}
