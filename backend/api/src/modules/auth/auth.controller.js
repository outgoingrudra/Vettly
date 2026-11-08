
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { signupSchema } from "./auth.schemas.js";
import { createHash, randomBytes } from "node:crypto";
import { loginSchema } from "./auth.schemas.js";
import { publishEmailJob } from "../../config/rabbitmq.js";
 




export async function signup(req, res) {
  const validation = signupSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid signup details.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { name, email, password } = validation.data;

  try {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerificationTokens: {
          create: {
            tokenHash,
            expiresAt,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    const appUrl = process.env.FRONTEND_URL;

    if (!appUrl) {
      console.error("FRONTEND_URL is not configured.");
      return res.status(201).json({
        success: true,
        message:
          "Account created, but verification email could not be configured. Please contact support.",
        data: { user },
      });
    }

    const verificationUrl = new URL("/verify-email", appUrl);
    verificationUrl.searchParams.set("token", rawToken);

    try {
      await publishEmailJob({
        type: "verification",
        to: user.email,
        data: {
          name: user.name,
          verificationUrl: verificationUrl.toString(),
          expiresIn: "30 minutes",
        },
      });
    } catch (emailError) {
      console.error("Failed to publish verification email:", emailError.message);

      return res.status(201).json({
        success: true,
        message:
          "Account created, but the verification email could not be queued. Please request a new verification email later.",
        data: { user },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      data: { user },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again.",
    });
  }
}




export async function login(req, res) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email and password.",
    });
  }

  const { email, password } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Use the same response whether the email or password is wrong.
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate a high-entropy session secret.
    const rawToken = randomBytes(32).toString("base64url");

    // Store only its SHA-256 hash in the database.
    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: req.get("user-agent")?.slice(0, 500),
        ipAddress: req.ip,
      },
    });

    res.cookie("vettly_session", rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
}



export async function logout(req, res) {
  const token = req.cookies?.vettly_session;

  try {
    if (token) {
      const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

      await prisma.session.deleteMany({
        where: { tokenHash },
      });
    }

    res.clearCookie("vettly_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log out. Please try again.",
    });
  }
}



export async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile.",
    });
  }
}






export async function listSessions(req, res) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.id,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActiveAt: true,
        expiresAt: true,
      },
      orderBy: {
        lastActiveAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map((session) => ({
          ...session,
          isCurrent: session.id === req.sessionId,
        })),
      },
    });
  } catch (error) {
    console.error("List sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve sessions.",
    });
  }
}



export async function revokeSession(req, res) {
  const { id } = req.params;

  try {
    const result = await prisma.session.deleteMany({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    // If this was the current session, clear its cookie too.
    if (id === req.sessionId) {
      res.clearCookie("vettly_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke session error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke session.",
    });
  }
}



export async function revokeAllSessions(req, res) {
  try {
    await prisma.session.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    res.clearCookie("vettly_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "All sessions have been revoked. Please log in again.",
    });
  } catch (error) {
    console.error("Revoke all sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke sessions.",
    });
  }
}



export async function verifyEmail(req, res) {
  const token = req.body?.token;

  if (typeof token !== "string" || token.length === 0 || token.length > 200) {
    return res.status(400).json({
      success: false,
      message: "A valid verification token is required.",
    });
  }

  try {
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    if (verificationToken.expiresAt <= new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link. Please request a new one.",
      });
    }

    if (verificationToken.user.emailVerifiedAt) {
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: verificationToken.userId },
      });

      return res.status(200).json({
        success: true,
        message: "Email address is already verified. You can log in.",
      });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { userId: verificationToken.userId },
      }),
    ]);

    // Publish the welcome email after successful verification.
    // If publishing fails, verification remains successful.
    try {
      const { publishEmailJob } = await import("../../config/rabbitmq.js");

      await publishEmailJob({
        type: "welcome",
        to: verificationToken.user.email,
        data: { name: verificationToken.user.name },
      });
    } catch (emailError) {
      console.error("Welcome email publishing failed:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. Welcome to Vettly!",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email. Please try again.",
    });
  }
}



export async function resendVerificationEmail(req, res) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  const genericResponse = {
    success: true,
    message:
      "If an unverified account exists for this email, a verification email will be sent.",
  };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
      },
    });

    // Avoid revealing whether an account exists or is already verified.
    if (!user || user.emailVerifiedAt) {
      return res.status(200).json(genericResponse);
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      console.error("FRONTEND_URL is not configured.");
      return res.status(200).json(genericResponse);
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Replace previous verification tokens with a fresh token.
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const verificationUrl = new URL("/verify-email", frontendUrl);
    verificationUrl.searchParams.set("token", rawToken);

    try {
      await publishEmailJob({
        type: "verification",
        to: user.email,
        data: {
          name: user.name,
          verificationUrl: verificationUrl.toString(),
          expiresIn: "30 minutes",
        },
      });
    } catch (publishError) {
      console.error(
        "Failed to queue verification email:",
        publishError.message,
      );

      // Remove the token if the job could not be queued.
      await prisma.emailVerificationToken.deleteMany({
        where: { tokenHash },
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request. Please try again.",
    });
  }
}





export async function forgotPassword(req, res) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

 

  const genericResponse = {
    success: true,
    message:
  "If an account exists for this email, password-reset instructions will be sent to it. Check your inbox.",
  };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Never reveal whether an account exists.
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      console.error("FRONTEND_URL is not configured.");
      return res.status(200).json(genericResponse);
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Replace any previous reset tokens for this user.
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const resetUrl = new URL("/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", rawToken);

    try {
      await publishEmailJob({
        type: "password_reset",
        to: user.email,
        data: {
          name: user.name,
          resetUrl: resetUrl.toString(),
          expiresIn: "15 minutes",
        },
      });
    } catch (publishError) {
      console.error(
        "Failed to queue password reset email:",
        publishError.message,
      );

      // Remove the unusable token if the job was not queued.
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request. Please try again.",
    });
  }
}



export async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 200 ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid token and password of 8–128 characters are required.",
    });
  }

  try {
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!resetToken || resetToken.expiresAt <= new Date()) {
      if (resetToken) {
        await prisma.passwordResetToken.deleteMany({
          where: { id: resetToken.id },
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link. Please request another.",
      });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    res.clearCookie("vettly_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again.",
    });
  }
}
