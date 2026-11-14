import { createHash } from "node:crypto";



import prisma from "../../lib/prisma.js";
import { createInterviewSchema , acceptInvitationSchema} from "./interview.schemas.js";

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
    if (!req.user?.emailVerifiedAt) return res.status(403).json({ success: false, message: "Verify your email before creating an interview." });
    const creatorId = req.user?.id;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const interview = await prisma.interview.create({
      data: {
        ...parsed.data,
        creatorId,
        status: "DRAFT",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Interview created successfully.",
      data: { interview, joinUrl: new URL("/interviews/" + interview.id + "/join", frontendUrl).href },
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
      include: { questions: { orderBy: { position: "asc" } } },
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

    // Zod defaults belong to creation. A PATCH changes only supplied fields.
    const changes = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => Object.hasOwn(req.body, key)));
    const interview = await prisma.interview.update({
      where: { id, creatorId, status: "DRAFT" },
      data: changes,
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

    const started = await prisma.interview.updateMany({
      where: { id, creatorId, status: "DRAFT", OR: [{ format: "LIVE" }, { questions: { some: {} } }] },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    if (!started.count) return res.status(409).json({ success: false, message: "Add questions to an async draft before starting." });
    const publishedInterview = await prisma.interview.findUnique({ where: { id } });
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

    const search = req.query.search ?? "";
    if (typeof search !== "string" || search.length > 254) {
      return res.status(400).json({ success: false, message: "Invalid candidate search." });
    }
    const contains = { contains: search.trim(), mode: "insensitive" };
    const where = {
      interviewId,
      ...(status ? { status } : {}),
      ...(search.trim() ? { OR: [{ email: contains }, { user: { name: contains } }] } : {}),
    };

    const [participants, total] = await Promise.all([
      prisma.interviewParticipant.findMany({
        where,
        select: {
          id: true,
          email: true,
          userId: true,
          status: true,
          user: { select: { name: true } },
          attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, deadline: true, submittedAt: true, score: true, aiStatus: true, warningCount: true, terminationReason: true } },
          invitedAt: true,
          invitationExpiresAt: true,
          acceptedAt: true,
          startedAt: true,
          completedAt: true,
          streamSyncedAt: true,
          streamSyncError: true,
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
        participants: participants.map(p => {
          const attempt = p.attempts[0];
          const expired = attempt?.status === "IN_PROGRESS" && attempt.deadline && attempt.deadline < new Date();
          return { ...p, outcome: expired ? "DID_NOT_SUBMIT" : attempt?.status ?? p.status };
        }),
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


