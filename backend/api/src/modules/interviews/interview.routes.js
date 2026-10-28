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

export default router;


