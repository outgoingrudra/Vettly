-- CreateEnum
CREATE TYPE "InterviewAttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "InterviewAttempt" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "InterviewAttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "streamCallId" TEXT,
    "streamChatChannelId" TEXT,
    "score" DOUBLE PRECISION,
    "evaluation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewAttempt_interviewId_status_idx" ON "InterviewAttempt"("interviewId", "status");

-- CreateIndex
CREATE INDEX "InterviewAttempt_participantId_createdAt_idx" ON "InterviewAttempt"("participantId", "createdAt");

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "InterviewParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
