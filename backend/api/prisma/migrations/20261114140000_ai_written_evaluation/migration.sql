ALTER TABLE "InterviewAttempt" ADD COLUMN "aiStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED';
UPDATE "InterviewQuestion" SET "marks" = 10 WHERE "kind" = 'WRITTEN' AND "marks" = 0;
UPDATE "InterviewAttempt"
SET "aiStatus" = 'PENDING'
WHERE status = 'SUBMITTED' AND evaluation IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(evaluation::jsonb -> 'items') AS item
    WHERE item ->> 'kind' = 'WRITTEN'
  );
