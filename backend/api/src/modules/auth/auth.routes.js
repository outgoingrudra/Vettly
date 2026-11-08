import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signup, login , logout } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getProfile } from "./auth.controller.js";
import { parsePicture, parseResume, uploadPicture, deletePicture, uploadResume, deleteResume, candidateProfile } from "./profile-files.js";
import {
  listSessions,
  revokeSession,
  revokeAllSessions,
  verifyEmail ,
  resendVerificationEmail ,
  forgotPassword,
  resetPassword,

} from "./auth.controller.js";

const router = Router();

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});


const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please try again later.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
});

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getProfile);
// Profile picture
router.post(
  "/profile-picture",
  requireAuth,
  parsePicture,
  uploadPicture
);

router.delete(
  "/profile-picture",
  requireAuth,
  deletePicture
);
router.post("/resume", requireAuth, parseResume, uploadResume);
router.delete("/resume", requireAuth, deleteResume);
router.get("/profiles/:userId", requireAuth, candidateProfile);
router.get("/sessions", requireAuth, listSessions);
router.delete("/sessions/:id", requireAuth, revokeSession);
router.delete("/sessions", requireAuth, revokeAllSessions);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationLimiter ,  resendVerificationEmail);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

export default router;
