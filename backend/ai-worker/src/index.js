import "dotenv/config";
import amqp from "amqplib";
import pg from "pg";
import { evaluate } from "./evaluate.js";

const { DATABASE_URL, RABBITMQ_URL, GEMINI_API_KEY } = process.env;
if (!DATABASE_URL || !RABBITMQ_URL || !GEMINI_API_KEY) {
  throw new Error("Set DATABASE_URL, RABBITMQ_URL, and GEMINI_API_KEY.");
}
const queue = process.env.RABBITMQ_AI_QUEUE || "vettly.assessment";
const retryDelays = [30000, 120000, 300000];
const retryQueues = retryDelays.map((_, index) => `${queue}.retry.${index + 1}`);
const pool = new pg.Pool({ connectionString: DATABASE_URL });
const connection = await amqp.connect(RABBITMQ_URL);
const channel = await connection.createConfirmChannel();
await channel.assertQueue(queue, { durable: true });
for (const [index, retryQueue] of retryQueues.entries()) {
  await channel.assertQueue(retryQueue, {
    durable: true,
    arguments: { "x-message-ttl": retryDelays[index],
      "x-dead-letter-exchange": "", "x-dead-letter-routing-key": queue },
  });
}
await channel.prefetch(1);

async function processAttempt(attemptId) {
  const claimed = await pool.query(
    `UPDATE "InterviewAttempt" SET "aiStatus" = 'PROCESSING'
     WHERE id = $1 AND status = 'SUBMITTED' AND "aiStatus" IN ('PENDING', 'RETRYING')
     RETURNING id, evaluation, score`, [attemptId],
  );
  if (!claimed.rowCount) return;
  const attempt = claimed.rows[0];
  const evaluation = attempt.evaluation;
  const originalItems = evaluation.items.map(item =>
    item.kind === "WRITTEN" ? { ...item, marks: item.marks || 10 } : item);
  const report = await evaluate(originalItems, {
    apiKey: GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    fallbackModel: process.env.GEMINI_FALLBACK_MODEL || "gemini-3.8-flash",
  });
  const items = originalItems.map(item => {
    if (item.kind !== "WRITTEN") return item;
    const answer = report.answers.get(item.questionId);
    return { ...item, earned: answer.marks, aiReason: answer.reason.trim() };
  });
  const total = items.reduce((sum, item) => sum + item.earned, 0);
  await pool.query(
    `UPDATE "InterviewAttempt" SET evaluation = $2::jsonb, score = $3,
       "aiStatus" = 'COMPLETED', "updatedAt" = NOW()
     WHERE id = $1 AND "aiStatus" = 'PROCESSING'`,
    [attemptId, JSON.stringify({ ...evaluation, items, total,
      maximum: items.reduce((sum, item) => sum + item.marks, 0),
      aiSummary: { summary: report.summary, strengths: report.strengths,
        improvements: report.improvements } }), total],
  );
}

async function consume(message) {
  let attemptId;
  try {
    ({ attemptId } = JSON.parse(message.content.toString()));
    if (typeof attemptId !== "string" || !attemptId) throw new Error("Invalid assessment job.");
    await processAttempt(attemptId);
    channel.ack(message);
  } catch (error) {
    console.error("Assessment evaluation failed:", error.message);
    try {
      const retries = Number(message.properties.headers?.retries || 0);
      if (attemptId && retries < 3) {
        await pool.query(
          `UPDATE "InterviewAttempt" SET "aiStatus" = 'RETRYING'
           WHERE id = $1 AND "aiStatus" = 'PROCESSING'`, [attemptId],
        );
        channel.sendToQueue(retryQueues[retries], Buffer.from(JSON.stringify({ attemptId })), {
          persistent: true, headers: { retries: retries + 1 },
        });
        await channel.waitForConfirms();
      } else if (attemptId) {
        await pool.query(
          `UPDATE "InterviewAttempt" SET "aiStatus" = 'FAILED'
           WHERE id = $1 AND "aiStatus" = 'PROCESSING'`, [attemptId],
        );
      }
      channel.ack(message);
    } catch (retryError) {
      console.error("Could not schedule assessment retry:", retryError.message);
      channel.nack(message, false, true);
    }
  }
}

// Recover submissions whose queue publish failed, and jobs interrupted by a worker restart.
await pool.query(`UPDATE "InterviewAttempt" SET "aiStatus" = 'PENDING'
  WHERE "aiStatus" = 'PROCESSING' AND status = 'SUBMITTED'`);
const recover = async () => {
  const pending = await pool.query(`SELECT id FROM "InterviewAttempt"
    WHERE "aiStatus" = 'PENDING' AND status = 'SUBMITTED' LIMIT 100`);
  for (const row of pending.rows) {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({ attemptId: row.id })), { persistent: true });
  }
  await channel.waitForConfirms();
};
await recover();
setInterval(() => recover().catch(error => console.error("Assessment recovery failed:", error.message)), 60000);
await channel.consume(queue, consume, { noAck: false });
console.log(`AI assessment worker listening on ${queue}`);
