-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('LIVE', 'ASYNC');

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "format" "InterviewFormat" NOT NULL DEFAULT 'LIVE',
    "status" "InterviewStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "maxParticipants" INTEGER,
    "streamCallId" TEXT,
    "streamChatChannelId" TEXT,
    "preventCopyPasteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tabSwitchDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fullscreenRequired" BOOLEAN NOT NULL DEFAULT true,
    "faceDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "multipleFaceDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "suspiciousGestureDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cameraDisconnectDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_streamCallId_key" ON "Interview"("streamCallId");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_streamChatChannelId_key" ON "Interview"("streamChatChannelId");

-- CreateIndex
CREATE INDEX "Interview_creatorId_idx" ON "Interview"("creatorId");

-- CreateIndex
CREATE INDEX "Interview_status_scheduledAt_idx" ON "Interview"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
