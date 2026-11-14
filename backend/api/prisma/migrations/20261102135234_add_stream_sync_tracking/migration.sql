-- AlterTable
ALTER TABLE "InterviewParticipant" ADD COLUMN     "streamSyncError" TEXT,
ADD COLUMN     "streamSyncedAt" TIMESTAMP(3);
