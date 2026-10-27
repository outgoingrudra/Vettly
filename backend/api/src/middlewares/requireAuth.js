
import { createHash } from "node:crypto";
import prisma from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  const token = req.cookies?.vettly_session;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or expired. Please log in.",
      });
    }

    // Make the authenticated user available to the next handler.
    req.user = session.user;
    req.sessionId = session.id;

    return next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate request.",
    });
  }
}

