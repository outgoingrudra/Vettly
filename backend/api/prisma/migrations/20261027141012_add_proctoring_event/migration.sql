-- CreateEnum
CREATE TYPE "ProctoringEventType" AS ENUM ('COPY_ATTEMPT', 'CUT_ATTEMPT', 'PASTE_ATTEMPT', 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'FACE_MISSING', 'MULTIPLE_FACES', 'SUSPICIOUS_GESTURE', 'CAMERA_DISCONNECTED');

-- CreateEnum
CREATE TYPE "ProctoringReviewStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "ProctoringEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "type" "ProctoringEventType" NOT NULL,
    "status" "ProctoringReviewStatus" NOT NULL DEFAULT 'PENDING',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "details" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProctoringEvent_attemptId_occurredAt_idx" ON "ProctoringEvent"("attemptId", "occurredAt");

-- CreateIndex
CREATE INDEX "ProctoringEvent_attemptId_type_idx" ON "ProctoringEvent"("attemptId", "type");

-- CreateIndex
CREATE INDEX "ProctoringEvent_status_occurredAt_idx" ON "ProctoringEvent"("status", "occurredAt");

-- AddForeignKey
ALTER TABLE "ProctoringEvent" ADD CONSTRAINT "ProctoringEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "InterviewAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
