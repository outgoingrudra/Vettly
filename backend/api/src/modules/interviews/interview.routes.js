
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { createInterview } from "./interview.controller.js";

const router = Router();

router.post("/", requireAuth, createInterview);

export default router;
