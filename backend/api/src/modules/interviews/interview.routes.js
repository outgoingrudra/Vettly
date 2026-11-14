import rateLimit from "express-rate-limit";
import {
  join,
  preview,
  setQuestions,
  submitInterviewAttempt,
  createProctoringEvent,
  inviteParticipant,
  result,
  history,
  myAttempts,
  saveResultFeedback,
  publishResult,
  retryAssessment,
  resendResult,
} from "./attempt.controller.js";
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import {
  createInterview,
  listMyInterviews,
  getInterviewById,
  updateInterview,
  publishInterview,
  archiveInterview,
  deleteInterview,
  listInterviewParticipants,
  acceptInvitation,
  listProctoringEvents,
  reviewProctoringEvent,
  retryStreamSync,
} from "./interview.controller.js";

const router = Router();

const mailLimit = rateLimit({
  windowMs: 900000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
router.get("/results/mine", requireAuth, history);
router.get("/attempts/mine", requireAuth, myAttempts);
router.get("/:id/join", requireAuth, preview);
router.post("/:id/join", requireAuth, join);
router.put("/:id/questions", requireAuth, setQuestions);
router.get("/attempts/:attemptId/result", requireAuth, result);
router.patch("/attempts/:attemptId/feedback", requireAuth, saveResultFeedback);
router.post("/attempts/:attemptId/publish-result", requireAuth, publishResult);
router.post("/attempts/:attemptId/retry-assessment", requireAuth, retryAssessment);
router.post("/attempts/:attemptId/resend-result", requireAuth, mailLimit, resendResult);
router.post("/", requireAuth, createInterview);
router.get("/", requireAuth, listMyInterviews);
router.get("/:id", requireAuth, getInterviewById);
router.patch("/:id", requireAuth, updateInterview);
router.patch("/:id/publish", requireAuth, publishInterview);
router.patch("/:id/archive", requireAuth, archiveInterview);
router.delete("/:id", requireAuth, deleteInterview);
router.post("/:id/participants", requireAuth, mailLimit, inviteParticipant);
router.get("/:id/participants", requireAuth, listInterviewParticipants);
router.post("/accept-invitation", requireAuth, acceptInvitation);
router.post("/participants/:participantId/start", requireAuth, join);
router.post("/attempts/:attemptId/submit", requireAuth, submitInterviewAttempt);
router.post("/attempts/:attemptId/proctoring-events", requireAuth, createProctoringEvent);
router.get("/:id/proctoring-events", requireAuth, listProctoringEvents);
router.patch("/:id/proctoring-events/:eventId", requireAuth, reviewProctoringEvent);
router.post("/:id/participants/:participantId/retry-stream-sync", requireAuth, retryStreamSync);
export default router;
