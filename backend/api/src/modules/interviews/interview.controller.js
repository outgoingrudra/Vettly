import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import prisma from "../../lib/prisma.js";
import { createInterviewSchema , acceptInvitationSchema , createProctoringEventSchema} from "./interview.schemas.js";

import { addParticipantToStream } from "../stream/stream.controller.js";
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
    const email = parsed.data.email.trim().toLowerCase();

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
          where: {
            interviewId,
            status: {
              notIn: ["DECLINED", "EXPIRED"],
            },
          },
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

    return res.status(201).json({
      success: true,
      message: "Participant invitation created. Email delivery is not enabled yet.",
      data: {
        participant,
        ...(process.env.NODE_ENV !== "production"
          ? { invitationToken: rawToken }
          : {}),
      },
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




export async function acceptInvitation(req, res) {
  const parsed = acceptInvitationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "A valid invitation token is required.",
    });
  }

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "You must be logged in to accept this invitation.",
    });
  }

  const tokenHash = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const participant = await prisma.interviewParticipant.findUnique({
    where: { invitationTokenHash: tokenHash },
    select: {
      id: true,
      interviewId: true,
      email: true,
      status: true,
      invitationExpiresAt: true,
    },
  });

  if (!participant) {
    return res.status(400).json({
      success: false,
      message: "Invalid invitation token.",
    });
  }

  if (
    !participant.invitationExpiresAt ||
    participant.invitationExpiresAt <= new Date()
  ) {
    return res.status(400).json({
      success: false,
      message: "This invitation has expired.",
    });
  }

  if (participant.status !== "INVITED") {
    return res.status(409).json({
      success: false,
      message: "This invitation can no longer be accepted.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found.",
    });
  }

  if (
    user.email.trim().toLowerCase() !==
    participant.email.trim().toLowerCase()
  ) {
    return res.status(403).json({
      success: false,
      message: "This invitation was sent to a different email address.",
    });
  }

  const acceptedAt = new Date();

  const updated = await prisma.interviewParticipant.updateMany({
    where: {
      id: participant.id,
      invitationTokenHash: tokenHash,
      status: "INVITED",
      invitationExpiresAt: { gt: acceptedAt },
    },
    data: {
      userId: user.id,
      status: "ACCEPTED",
      acceptedAt,
      invitationTokenHash: null,
    },
  });

  if (updated.count !== 1) {
    return res.status(409).json({
      success: false,
      message: "The invitation has expired or has already been used.",
    });
  }

  try {
    const interview = await prisma.interview.findUnique({
      where: { id: participant.interviewId },
    });

    if (!interview?.streamCallId || !interview?.streamChatChannelId) {
      throw new Error("Stream call or chat has not been set up yet.");
    }

    await addParticipantToStream(interview, user);

    await prisma.interviewParticipant.update({
      where: { id: participant.id },
      data: {
        streamSyncedAt: new Date(),
        streamSyncError: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully.",
      participant: {
        id: participant.id,
        interviewId: participant.interviewId,
        email: participant.email,
        status: "ACCEPTED",
        streamSynced: true,
      },
    });
  } catch (error) {
    console.error("Stream participant sync failed:", error);

    await prisma.interviewParticipant.update({
      where: { id: participant.id },
      data: {
        streamSyncError: String(error.message || error).slice(0, 1000),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invitation accepted. Stream access synchronization is pending.",
      participant: {
        id: participant.id,
        interviewId: participant.interviewId,
        email: participant.email,
        status: "ACCEPTED",
        streamSynced: false,
      },
    });
  }
}

export async function retryStreamSync(req, res) {
  const { id: interviewId, participantId } = req.params;

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const interview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      creatorId: req.user.id,
    },
  });

  if (!interview) {
    return res.status(404).json({
      success: false,
      message: "Interview not found.",
    });
  }

  if (!interview.streamCallId || !interview.streamChatChannelId) {
    return res.status(409).json({
      success: false,
      message: "Stream has not been set up for this interview.",
    });
  }

  const participant = await prisma.interviewParticipant.findFirst({
    where: {
      id: participantId,
      interviewId,
      status: {
        in: ["ACCEPTED", "IN_PROGRESS"],
      },
      userId: {
        not: null,
      },
    },
  });

  if (!participant) {
    return res.status(404).json({
      success: false,
      message: "Accepted participant not found.",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: participant.userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Participant account not found.",
    });
  }

  try {
    await addParticipantToStream(interview, user);

    await prisma.interviewParticipant.update({
      where: { id: participant.id },
      data: {
        streamSyncedAt: new Date(),
        streamSyncError: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Participant successfully synchronized with Stream.",
      streamSynced: true,
    });
  } catch (error) {
    console.error("Stream retry failed:", error);

    await prisma.interviewParticipant.update({
      where: { id: participant.id },
      data: {
        streamSyncError: String(error.message || error).slice(0, 1000),
      },
    });

    return res.status(502).json({
      success: false,
      message: "Stream synchronization failed. Please try again.",
      streamSynced: false,
    });
  }
}

export async function startInterviewAttempt(req, res) {
  const participantId = req.params.participantId;

  if (!participantId) {
    return res.status(400).json({
      success: false,
      message: "Participant ID is required.",
    });
  }

  // Require authentication
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Find only the participant belonging to the logged-in user
  const participant = await prisma.interviewParticipant.findFirst({
    where: {
      id: participantId,
      userId: req.user.id,
    },
    include: {
      interview: {
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          durationMinutes: true,
        },
      },
    },
  });

  if (!participant) {
    return res.status(404).json({
      success: false,
      message: "Participant not found or you are not authorized.",
    });
  }

  if (!["ACCEPTED", "IN_PROGRESS"].includes(participant.status)) {
    return res.status(403).json({
      success: false,
      message: "You must accept the invitation before starting.",
    });
  }

  if (participant.interview.status !== "PUBLISHED") {
    return res.status(409).json({
      success: false,
      message: "This interview is not available.",
    });
  }

  if (
    participant.interview.scheduledAt &&
    participant.interview.scheduledAt > new Date()
  ) {
    return res.status(409).json({
      success: false,
      message: "This interview has not started yet.",
    });
  }

  // Find an existing active attempt
  const existingAttempt = await prisma.interviewAttempt.findFirst({
    where: {
      participantId,
      status: {
        in: ["IN_PROGRESS", "NOT_STARTED"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingAttempt) {
    if (existingAttempt.status === "NOT_STARTED") {
      const attempt = await prisma.$transaction(async (tx) => {
        const updatedAttempt = await tx.interviewAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });

        await tx.interviewParticipant.update({
          where: { id: participantId },
          data: {
            status: "IN_PROGRESS",
            startedAt: participant.startedAt ?? new Date(),
          },
        });

        return updatedAttempt;
      });

      return res.status(200).json({
        success: true,
        message: "Interview attempt started.",
        attempt,
      });
    }

    return res.status(200).json({
      success: true,
      message: "An interview attempt is already in progress.",
      attempt: existingAttempt,
    });
  }

  // Create a new attempt
  const attempt = await prisma.$transaction(async (tx) => {
    const now = new Date();

    const createdAttempt = await tx.interviewAttempt.create({
      data: {
        interviewId: participant.interviewId,
        participantId,
        status: "IN_PROGRESS",
        startedAt: now,
      },
    });

    await tx.interviewParticipant.update({
      where: { id: participantId },
      data: {
        status: "IN_PROGRESS",
        startedAt: participant.startedAt ?? now,
      },
    });

    return createdAttempt;
  });

  return res.status(201).json({
    success: true,
    message: "Interview attempt started.",
    attempt,
  });
}

export async function submitInterviewAttempt(req, res) {
  const { attemptId } = req.params;

  if (!attemptId) {
    return res.status(400).json({
      success: false,
      message: "Attempt ID is required.",
    });
  }

  // Require authentication
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Find the attempt and verify ownership
  const attempt = await prisma.interviewAttempt.findFirst({
    where: {
      id: attemptId,
      participant: {
        userId: req.user.id,
      },
    },
    include: {
      participant: {
        select: {
          id: true,
          status: true,
          userId: true,
        },
      },
    },
  });

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Interview attempt not found or you are not authorized.",
    });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(409).json({
      success: false,
      message: "Only an in-progress attempt can be submitted.",
    });
  }

  const submittedAt = new Date();

  // Submit attempt and update participant status atomically
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.interviewAttempt.updateMany({
      where: {
        id: attemptId,
        status: "IN_PROGRESS",
      },
      data: {
        status: "SUBMITTED",
        submittedAt,
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    await tx.interviewParticipant.updateMany({
      where: {
        id: attempt.participant.id,
        userId: req.user.id,
        status: "IN_PROGRESS",
      },
      data: {
        status: "COMPLETED",
        completedAt: submittedAt,
      },
    });

    return tx.interviewAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });
  });

  if (!result) {
    return res.status(409).json({
      success: false,
      message: "This attempt has already been submitted.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Interview attempt submitted successfully.",
    attempt: result,
  });
}

export async function createProctoringEvent(req, res) {
  const { attemptId } = req.params;

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const parsed = createProctoringEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid proctoring event data.",
      errors: parsed.error.flatten(),
    });
  }

  // Verify that this attempt belongs to the logged-in participant
  const attempt = await prisma.interviewAttempt.findFirst({
    where: {
      id: attemptId,
      participant: {
        userId: req.user.id,
      },
    },
    select: {
      id: true,
      status: true,
      interview: {
        select: {
          preventCopyPasteEnabled: true,
          tabSwitchDetectionEnabled: true,
          fullscreenRequired: true,
          faceDetectionEnabled: true,
          multipleFaceDetectionEnabled: true,
          suspiciousGestureDetectionEnabled: true,
          cameraDisconnectDetectionEnabled: true,
        },
      },
    },
  });

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Interview attempt not found or you are not authorized.",
    });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(409).json({
      success: false,
      message: "Proctoring events can only be recorded during an active attempt.",
    });
  }

  const eventSettings = {
    COPY_ATTEMPT: attempt.interview.preventCopyPasteEnabled,
    CUT_ATTEMPT: attempt.interview.preventCopyPasteEnabled,
    PASTE_ATTEMPT: attempt.interview.preventCopyPasteEnabled,
    TAB_SWITCH: attempt.interview.tabSwitchDetectionEnabled,
    FULLSCREEN_EXIT: attempt.interview.fullscreenRequired,
    FACE_MISSING: attempt.interview.faceDetectionEnabled,
    MULTIPLE_FACES: attempt.interview.multipleFaceDetectionEnabled,
    SUSPICIOUS_GESTURE: attempt.interview.suspiciousGestureDetectionEnabled,
    CAMERA_DISCONNECTED: attempt.interview.cameraDisconnectDetectionEnabled,
  };

  if (eventSettings[parsed.data.type] !== true) {
    return res.status(400).json({
      success: false,
      message: "This event is not enabled for the interview.",
    });
  }

  const event = await prisma.proctoringEvent.create({
    data: {
      attemptId,
      type: parsed.data.type,
      occurredAt: parsed.data.occurredAt,
      durationMs: parsed.data.durationMs,
      details: parsed.data.details,
    },
    select: {
      id: true,
      attemptId: true,
      type: true,
      status: true,
      occurredAt: true,
      durationMs: true,
      createdAt: true,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Proctoring event recorded for review.",
    event,
  });
}

export async function listProctoringEvents(req, res) {
  const { id: interviewId } = req.params;
  const { attemptId } = req.query;

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const page = Math.max(
    1,
    Number.parseInt(req.query.page, 10) || 1
  );

  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
  );

  // Only the interview creator can view proctoring events
  const interview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      creatorId: req.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!interview) {
    return res.status(404).json({
      success: false,
      message: "Interview not found.",
    });
  }

  // Validate optional attempt ID
  if (attemptId) {
    const attempt = await prisma.interviewAttempt.findFirst({
      where: {
        id: attemptId,
        interviewId,
      },
      select: {
        id: true,
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Interview attempt not found.",
      });
    }
  }

  const where = {
    attempt: {
      interviewId,
      ...(attemptId ? { id: attemptId } : {}),
    },
  };

  const [events, total] = await Promise.all([
    prisma.proctoringEvent.findMany({
      where,
      orderBy: {
        occurredAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        attemptId: true,
        type: true,
        status: true,
        occurredAt: true,
        durationMs: true,
        details: true,
        reviewedAt: true,
        reviewedById: true,
        reviewNotes: true,
      },
    }),

    prisma.proctoringEvent.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
export async function reviewProctoringEvent(req, res) {
  const { id: interviewId, eventId } = req.params;
  const { status, reviewNotes } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const allowedStatuses = [
    "REVIEWED",
    "DISMISSED",
    "CONFIRMED",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be REVIEWED, DISMISSED, or CONFIRMED.",
    });
  }

  if (
    reviewNotes !== undefined &&
    (
      typeof reviewNotes !== "string" ||
      reviewNotes.length > 2000
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Review notes must be a string of at most 2000 characters.",
    });
  }

  // Verify event belongs to an interview created by this user
  const event = await prisma.proctoringEvent.findFirst({
    where: {
      id: eventId,
      attempt: {
        interviewId,
        interview: {
          creatorId: req.user.id,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Proctoring event not found.",
    });
  }

  const updated = await prisma.proctoringEvent.updateMany({
    where: {
      id: eventId,
      attempt: {
        interviewId,
        interview: {
          creatorId: req.user.id,
        },
      },
    },
    data: {
      status,
      reviewNotes: reviewNotes?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: req.user.id,
    },
  });

  if (updated.count !== 1) {
    return res.status(409).json({
      success: false,
      message: "Unable to update the proctoring event.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Proctoring event review saved.",
  });
}


