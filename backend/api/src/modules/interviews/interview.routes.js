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
  inviteParticipant,
  acceptInvitation,
  startInterviewAttempt,
  submitInterviewAttempt ,
  listProctoringEvents,
  reviewProctoringEvent,
  createProctoringEvent ,
  retryStreamSync

} from "./interview.controller.js";

const router = Router();

router.post("/", requireAuth, createInterview);
router.get("/", requireAuth, listMyInterviews);
router.get("/:id", requireAuth, getInterviewById);
router.patch("/:id", requireAuth, updateInterview);
router.patch("/:id/publish", requireAuth, publishInterview);
router.patch("/:id/archive", requireAuth, archiveInterview);
router.delete("/:id", requireAuth, deleteInterview);
router.post("/:id/participants",requireAuth, inviteParticipant);
router.get("/:id/participants", requireAuth, listInterviewParticipants);
router.post("/accept-invitation", requireAuth , acceptInvitation);
router.post("/participants/:participantId/start",startInterviewAttempt);
router.post("/attempts/:attemptId/submit", submitInterviewAttempt);
router.post("/attempts/:attemptId/proctoring-events",createProctoringEvent);
router.get("/:id/proctoring-events", requireAuth, listProctoringEvents);
router.patch("/:id/proctoring-events/:eventId", requireAuth,reviewProctoringEvent);
router.post("/:id/participants/:participantId/retry-stream-sync",requireAuth,retryStreamSync);
export default router;


