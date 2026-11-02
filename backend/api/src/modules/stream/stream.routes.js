import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import {
  getStreamToken,
  setupInterviewStream,
} from "./stream.controller.js";
const router = Router();

router.post("/:id/token", requireAuth, getStreamToken);
router.post("/:id/setup", requireAuth, setupInterviewStream);
export default router;


