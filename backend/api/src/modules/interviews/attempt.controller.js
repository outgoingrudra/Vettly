import { z } from "zod";
import prisma from "../../lib/prisma.js";
import { publishEmailJob } from "../../config/rabbitmq.js";
import { addParticipantToStream } from "../stream/stream.controller.js";
import { createProctoringEventSchema } from "./interview.schemas.js";
import { grade, questionList } from "./assessment.js";

function fail(status, message) {
  throw Object.assign(new Error(message), { httpStatus: status });
}
function link(path) {
  return new URL(path, process.env.FRONTEND_URL || "http://localhost:3000").href;
}

export async function setQuestions(req, res) {
  const questions = questionList.safeParse(req.body?.questions);
  if (!questions.success) fail(400, "Invalid questions or answer keys.");
  await prisma.$transaction(async (tx) => {
    const draft = await tx.interview.updateMany({
      where: { id: req.params.id, creatorId: req.user.id, status: "DRAFT" },
      data: { updatedAt: new Date() },
    });
    if (!draft.count) fail(409, "An editable draft is required.");
    await tx.interviewQuestion.deleteMany({ where: { interviewId: req.params.id } });
    await tx.interviewQuestion.createMany({
      data: questions.data.map((q, position) => ({ ...q, position, interviewId: req.params.id })),
    });
  });
  res.json({ success: true });
}

export async function preview(req, res) {
  const interview = await prisma.interview.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      title: true,
      instructions: true,
      format: true,
      status: true,
      durationMinutes: true,
      scheduledAt: true,
      warningLimit: true,
      preventCopyPasteEnabled: true,
      tabSwitchDetectionEnabled: true,
      fullscreenRequired: true,
      faceDetectionEnabled: true,
      multipleFaceDetectionEnabled: true,
      suspiciousGestureDetectionEnabled: true,
      cameraDisconnectDetectionEnabled: true,
    },
  });
  if (!interview) fail(404, "Interview not found.");
  const attempt = await prisma.interviewAttempt.findFirst({
    where: { interviewId: interview.id, participant: { userId: req.user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, deadline: true, submittedAt: true, terminationReason: true },
  });
  res.json({ success: true, interview, attempt, serverTime: new Date() });
}

export async function inviteParticipant(req, res) {
  const email = z.string().trim().email().max(254).safeParse(req.body?.email);
  if (!email.success) fail(400, "Valid email required.");
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, creatorId: req.user.id, status: { not: "ARCHIVED" } },
    select: { id: true, title: true, creator: { select: { name: true } } },
  });
  if (!interview) fail(404, "Interview not found.");
  await publishEmailJob({
    type: "interview_invitation",
    to: email.data,
    data: {
      url: link("/interviews/" + interview.id + "/join"),
      interviewTitle: interview.title,
      hostName: interview.creator.name,
    },
  });
  res.status(202).json({ success: true, message: "Invitation email queued." });
}

export async function join(req, res) {
  let id = req.params.id;
  if (!id) {
    const participant = await prisma.interviewParticipant.findFirst({
      where: { id: req.params.participantId, userId: req.user.id },
    });
    if (!participant) fail(404, "Participant not found.");
    id = participant.interviewId;
  }
  const result = await prisma.$transaction(async (tx) => {
    // Serialize admission with other joins and the host closing entry.
    const lock = await tx.interview.updateMany({ where: { id }, data: { updatedAt: new Date() } });
    if (!lock.count) fail(404, "Interview not found.");
    const interview = await tx.interview.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { position: "asc" },
          select: { id: true, prompt: true, options: true, marks: true },
        },
      },
    });
    if (interview.creatorId === req.user.id) fail(403, "The host cannot join as a candidate.");
    const existing = await tx.interviewParticipant.findUnique({
      where: { interviewId_email: { interviewId: id, email: req.user.email } },
      include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    let attempt = existing?.attempts[0];
    if (existing?.userId && existing.userId !== req.user.id)
      fail(403, "Participant belongs to another account.");
    if (attempt && attempt.status !== "NOT_STARTED") {
      if (attempt.status !== "IN_PROGRESS" || new Date() > attempt.deadline)
        fail(409, "Attempt is closed.");
    } else {
      if (interview.status !== "PUBLISHED" || interview.scheduledAt > new Date())
        fail(409, "Entry is closed.");
      if (interview.format === "LIVE" && !interview.streamCallId)
        fail(409, "Video room is not ready.");
      if (
        interview.maxParticipants &&
        (await tx.interviewParticipant.count({
          where: { interviewId: id, startedAt: { not: null } },
        })) >= interview.maxParticipants
      )
        fail(409, "Interview is full.");
      const startedAt = new Date();
      const data = {
        userId: req.user.id,
        startedAt,
        status: "IN_PROGRESS",
        invitationTokenHash: null,
      };
      const participant = await tx.interviewParticipant.upsert({
        where: { interviewId_email: { interviewId: id, email: req.user.email } },
        create: { interviewId: id, email: req.user.email, ...data },
        update: data,
      });
      const timing = {
        startedAt,
        deadline: new Date(+startedAt + interview.durationMinutes * 60000),
        status: "IN_PROGRESS",
      };
      attempt = attempt
        ? await tx.interviewAttempt.update({ where: { id: attempt.id }, data: timing })
        : await tx.interviewAttempt.create({
            data: { interviewId: id, participantId: participant.id, ...timing },
          });
    }
    return { interview, attempt };
  });
  const { interview, attempt } = result;
  if (interview.format === "LIVE") {
    try {
      await addParticipantToStream(interview, req.user);
      await prisma.interviewParticipant.update({
        where: { id: attempt.participantId },
        data: { streamSyncedAt: new Date(), streamSyncError: null },
      });
    } catch (error) {
      await prisma.interviewParticipant.update({
        where: { id: attempt.participantId },
        data: { streamSyncedAt: null, streamSyncError: String(error.message || error).slice(0, 1000) },
      });
      fail(502, "Video access is being restored. Ask the host to retry video access, then resume.");
    }
  }
  res.json({
    success: true,
    attempt: {
      id: attempt.id,
      participantId: attempt.participantId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadline: attempt.deadline,
    },
    questions: interview.questions,
    warningCount: attempt.warningCount,
    serverTime: new Date(),
  });
}

async function activeAttempt(tx, req) {
  const id = req.params.attemptId;
  const changed = await tx.interviewAttempt.updateMany({
    where: { id, status: "IN_PROGRESS", participant: { userId: req.user.id } },
    data: { updatedAt: new Date() },
  });
  if (!changed.count) fail(409, "Active attempt required.");
  const attempt = await tx.interviewAttempt.findUnique({
    where: { id },
    include: { interview: true },
  });
  if (new Date() > attempt.deadline) fail(409, "Time expired. Did not submit.");
  return attempt;
}
export async function submitInterviewAttempt(req, res) {
  const receipt = await prisma.$transaction(async (tx) => {
    const attempt = await activeAttempt(tx, req);
    const questions = await tx.interviewQuestion.findMany({
      where: { interviewId: attempt.interviewId },
      orderBy: { position: "asc" },
    });
    const evaluation = grade(questions, req.body?.answers ?? (questions.length ? null : []));
    if (!evaluation) fail(400, "Invalid final answers.");
    const submittedAt = new Date();
    await tx.interviewParticipant.update({
      where: { id: attempt.participantId },
      data: { status: "COMPLETED", completedAt: submittedAt },
    });
    return tx.interviewAttempt.update({
      where: { id: attempt.id },
      data: { submittedAt, status: "SUBMITTED", score: evaluation.total, evaluation },
      select: { id: true, status: true, submittedAt: true },
    });
  });
  res.json({ success: true, attempt: receipt });
}

const detection = {
  COPY_ATTEMPT: "preventCopyPasteEnabled",
  CUT_ATTEMPT: "preventCopyPasteEnabled",
  PASTE_ATTEMPT: "preventCopyPasteEnabled",
  TAB_SWITCH: "tabSwitchDetectionEnabled",
  FULLSCREEN_EXIT: "fullscreenRequired",
  FACE_MISSING: "faceDetectionEnabled",
  MULTIPLE_FACES: "multipleFaceDetectionEnabled",
  SUSPICIOUS_GESTURE: "suspiciousGestureDetectionEnabled",
  LOOKING_AWAY: "faceDetectionEnabled",
  CAMERA_DISCONNECTED: "cameraDisconnectDetectionEnabled",
};
export async function createProctoringEvent(req, res) {
  const parsed = createProctoringEventSchema.safeParse(req.body);
  if (!parsed.success) fail(400, "Invalid proctoring event.");
  const result = await prisma.$transaction(async (tx) => {
    const attempt = await activeAttempt(tx, req);
    const { type } = parsed.data;
    if (!attempt.interview[detection[type]]) fail(400, "Detection disabled.");
    const duplicate = await tx.proctoringEvent.findFirst({
      where: { attemptId: attempt.id, type, createdAt: { gte: new Date(Date.now() - 3000) } },
    });
    const warningLimit = attempt.interview.warningLimit;
    if (duplicate)
      return {
        warningCount: attempt.warningCount,
        warningLimit,
        countedAsWarning: false,
        terminated: false,
      };
    const event = await tx.proctoringEvent.create({ data: { attemptId: attempt.id, ...parsed.data } });
    const countedAsWarning = type !== "SUSPICIOUS_GESTURE";
    const warningCount = attempt.warningCount + Number(countedAsWarning);
    const terminated = countedAsWarning && warningCount >= warningLimit;
    const terminationReason =
      type === "CAMERA_DISCONNECTED"
        ? "Camera disconnected during the interview"
        : "Security warning limit exceeded";
    await tx.interviewAttempt.update({
      where: { id: attempt.id },
      data: {
        warningCount,
        ...(terminated ? { status: "ABANDONED", terminationReason, completedAt: new Date() } : {}),
      },
    });
    if (terminated)
      await tx.interviewParticipant.update({
        where: { id: attempt.participantId },
        data: { status: "EXPIRED" },
      });
    return { event, warningCount, warningLimit, countedAsWarning, terminated };
  });
  res.status(result.event ? 201 : 200).json({ success: true, ...result });
}

export async function result(req, res) {
  const attempt = await prisma.interviewAttempt.findFirst({
    where: {
      id: req.params.attemptId,
      OR: [
        { status: { in: ["SUBMITTED", "COMPLETED"] }, interview: { creatorId: req.user.id } },
        { status: "COMPLETED", participant: { userId: req.user.id } },
      ],
    },
    select: {
      id: true,
      status: true,
      score: true,
      evaluation: true,
      feedback: true,
      submittedAt: true,
      interview: { select: { title: true } },
      participant: { select: { userId: true, email: true } },
    },
  });
  if (!attempt) fail(404, "Scorecard unavailable.");
  res.json({ success: true, data: attempt });
}
export async function myAttempts(req, res) {
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) fail(400, "Invalid page.");
  const where = { participant: { userId: req.user.id } };
  const take = 12;
  const [attempts, total, active, awaiting, published] = await Promise.all([
    prisma.interviewAttempt.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take, skip: (page - 1) * take,
      select: {
        id: true, status: true, deadline: true, startedAt: true, submittedAt: true,
        interview: { select: { id: true, title: true, format: true } },
      },
    }),
    prisma.interviewAttempt.count({ where }),
    prisma.interviewAttempt.count({ where: { ...where, status: "IN_PROGRESS", deadline: { gt: new Date() } } }),
    prisma.interviewAttempt.count({ where: { ...where, status: "SUBMITTED" } }),
    prisma.interviewAttempt.count({ where: { ...where, status: "COMPLETED" } }),
  ]);
  res.json({ success: true, data: { attempts, totalPages: Math.ceil(total / take), summary: { total, active, awaiting, published } } });
}

export async function history(req, res) {
  const attempts = await prisma.interviewAttempt.findMany({
    where: { participant: { userId: req.user.id }, status: "COMPLETED" },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      score: true,
      submittedAt: true,
      interview: { select: { id: true, title: true } },
    },
  });
  res.json({ success: true, data: attempts });
}
export async function publishResult(req, res) {
  const parsed = z
    .object({ feedback: z.string().trim().max(5000).optional() })
    .safeParse(req.body ?? {});
  if (!parsed.success) fail(400, "Invalid feedback.");
  const attempt = await prisma.interviewAttempt.findFirst({
    where: { id: req.params.attemptId, interview: { creatorId: req.user.id, status: "ARCHIVED" } },
    include: {
      participant: { select: { email: true } },
      interview: { select: { title: true, creator: { select: { name: true } } } },
    },
  });
  if (!attempt) fail(409, "Close entry before publishing results.");
  const active = await prisma.interviewAttempt.count({
    where: { interviewId: attempt.interviewId, status: "IN_PROGRESS", deadline: { gte: new Date() } },
  });
  if (active) fail(409, "Candidates are still answering.");
  const changed = await prisma.interviewAttempt.updateMany({
    where: { id: attempt.id, status: "SUBMITTED" },
    data: { status: "COMPLETED", completedAt: new Date(), feedback: parsed.data.feedback },
  });
  if (!changed.count) fail(409, "A submitted scorecard is required.");
  await notifyResult(attempt, res);
}
async function notifyResult(attempt, res) {
  try {
    await publishEmailJob({
      type: "result_published",
      to: attempt.participant.email,
      data: {
        url: link("/results/" + attempt.id),
        interviewTitle: attempt.interview.title,
        hostName: attempt.interview.creator.name,
      },
    });
    res.json({ success: true, emailQueued: true });
  } catch {
    res
      .status(503)
      .json({
        success: false,
        published: true,
        emailQueued: false,
        message: "Result published. Retry its email notification.",
      });
  }
}
export async function resendResult(req, res) {
  const attempt = await prisma.interviewAttempt.findFirst({
    where: { id: req.params.attemptId, status: "COMPLETED", interview: { creatorId: req.user.id } },
    include: {
      participant: { select: { email: true } },
      interview: { select: { title: true, creator: { select: { name: true } } } },
    },
  });
  if (!attempt) fail(404, "Published scorecard not found.");
  await notifyResult(attempt, res);
}
