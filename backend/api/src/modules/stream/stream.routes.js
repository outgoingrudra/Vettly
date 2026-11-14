import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import {
  endMeeting,
  getStreamToken,
  setupInterviewStream,
} from "./stream.controller.js";
const router = Router();

router.post("/:id/token", requireAuth, getStreamToken);
router.post("/:id/setup", requireAuth, setupInterviewStream);
router.post("/:id/end", requireAuth, endMeeting);
export default router;


