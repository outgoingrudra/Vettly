ALTER TABLE "User" ADD COLUMN "pictureFileId" TEXT, ADD COLUMN "resumePath" TEXT, ADD COLUMN "resumeFileId" TEXT;
ALTER TABLE "Interview" ADD COLUMN "warningLimit" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "InterviewAttempt" ADD COLUMN "deadline" TIMESTAMP(3), ADD COLUMN "warningCount" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "terminationReason" TEXT, ADD COLUMN "feedback" TEXT;
UPDATE "InterviewAttempt" a SET "deadline" = COALESCE(a."startedAt", a."createdAt") + i."durationMinutes" * INTERVAL '1 minute' FROM "Interview" i WHERE a."interviewId" = i.id AND a.status = 'IN_PROGRESS';
UPDATE "InterviewAttempt" a SET "warningCount" = (SELECT count(*) FROM "ProctoringEvent" e WHERE e."attemptId" = a.id AND e.type <> 'SUSPICIOUS_GESTURE');
ALTER TYPE "ProctoringEventType" ADD VALUE 'LOOKING_AWAY';
CREATE TABLE "InterviewQuestion" (
  id TEXT PRIMARY KEY, "interviewId" TEXT NOT NULL REFERENCES "Interview"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  position INTEGER NOT NULL, prompt TEXT NOT NULL, options TEXT[] NOT NULL, "correctOption" INTEGER NOT NULL, marks INTEGER NOT NULL DEFAULT 1,
  UNIQUE ("interviewId", position)
);
