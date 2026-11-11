import getStream from "../../lib/stream.js";
import prisma from "../../lib/prisma.js";

export async function getStreamToken(req, res) {
  try {
    const { id: interviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        title: true,
        status: true,
        streamCallId: true,
        streamChatChannelId: true,
        creatorId: true,
        participants: {
          where: {
            userId,
            status: {
              in: ["IN_PROGRESS"],
            },
          },
          select: {
            id: true,
            streamSyncedAt: true,
            attempts: { where: { status: "IN_PROGRESS", deadline: { gte: new Date() } }, select: { deadline: true }, take: 1 },
          },
        },
      },
    });

    if (!interview || interview.status === "DRAFT") {
      return res.status(404).json({
        success: false,
        message: "Published interview not found.",
      });
    }

    const isCreator = interview.creatorId === userId;
    const participant = interview.participants[0];

    if (!isCreator && !participant?.attempts.length) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to join this interview.",
      });
    }

    if (!interview.streamCallId || !interview.streamChatChannelId) {
      return res.status(409).json({
        success: false,
        message: "Stream has not been set up for this interview yet.",
      });
    }

    if (!isCreator && !participant.streamSyncedAt) {
      return res.status(409).json({
        success: false,
        message: "Your Stream access is still being synchronized. Please try again.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = isCreator
      ? 3600
      : Math.floor((participant.attempts[0].deadline.getTime() - Date.now()) / 1000);
    const ttl = Math.max(1, Math.min(3600, secondsLeft));
    // Allow for clock drift between this server and Stream when validating the JWT.
    const token = getStream().generateUserToken({
      user_id: user.id,
      iat: now - 60,
      exp: now + ttl,
    });

    return res.status(200).json({
      success: true,
      data: {
        apiKey: process.env.STREAM_API_KEY,
        token,
        user: {
          id: user.id,
          name: user.name,
        },
        callId: interview.streamCallId,
        chatChannelId: interview.streamChatChannelId,
        expiresIn: ttl,
      },
    });
  } catch (error) {
    console.error("Get Stream token error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate Stream access token.",
    });
  }
}

export async function setupInterviewStream(req, res) {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Verify interview ownership and retrieve participants.
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        creatorId: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          where: {
            userId: { not: null },
            status: { in: ["ACCEPTED", "IN_PROGRESS"] },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    if (interview.status !== "PUBLISHED") {
      return res.status(409).json({
        success: false,
        message: "Publish the interview before setting up Stream.",
      });
    }

    // Stable IDs make repeated setup requests idempotent.
    const callId = `vettly-${interview.id}`;
    const chatChannelId = `vettly-${interview.id}`;

    const members = [
      {
        id: interview.creator.id,
        name: interview.creator.name,
      },
      ...interview.participants
        .filter((participant) => participant.user)
        .map((participant) => ({
          id: participant.user.id,
          name: participant.user.name,
        })),
    ];

    // Register users with Stream.
    const stream = getStream();
    await stream.upsertUsers(members);

    // Create or retrieve the chat channel.
    const channelResponse = await stream.chat.getOrCreateChannel({
      type: "messaging",
      id: chatChannelId,
      data: {
        created_by_id: userId,
        members: members.map((member) => ({
          user_id: member.id,
        })),
        custom: {
          interviewId: interview.id,
          application: "vettly",
        },
      },
    });

    const channelCid = channelResponse.channel?.cid;

    if (!channelCid) {
      throw new Error("Stream did not return a chat channel CID.");
    }

    // Create or retrieve the video call and connect it to chat.
    const callResponse = await stream.video.getOrCreateCall({
      type: "default",
      id: callId,
      data: {
        created_by_id: userId,
        members: members.map((member) => ({
          user_id: member.id,
        })),
        channel_cid: channelCid,
        custom: {
          interviewId: interview.id,
          application: "vettly",
        },
      },
    });

    if (!callResponse.call) {
      throw new Error("Stream did not return a video call.");
    }

    // Save Stream resource references in Vettly.
    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        streamCallId: callId,
        streamChatChannelId: chatChannelId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Interview video call and chat configured successfully.",
      stream: {
        callId,
        callType: "default",
        chatChannelId,
        chatChannelCid: channelCid,
      },
    });
  } catch (error) {
    console.error("Stream setup failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to configure interview video and chat.",
    });
  }
}



export async function addParticipantToStream(interview, user) {
  if (!interview.streamCallId || !interview.streamChatChannelId) {
    // Stream setup has not happened yet.
    // The participant will be included during initial setup.
    return;
  }

  // Ensure the participant exists in Stream.
  const stream = getStream();
  await stream.upsertUsers([
    {
      id: user.id,
      name: user.name,
    },
  ]);

  // Add participant to the video call.
  const call = stream.video.call(
    "default",
    interview.streamCallId
  );

  await call.updateCallMembers({
    update_members: [{ user_id: user.id }],
  });

  // Add participant to the chat channel.
  await stream.chat.updateChannel({
    type: "messaging",
    id: interview.streamChatChannelId,
    add_members: [user.id],
  });
}


