
import amqp from "amqplib";
import { randomUUID } from "node:crypto";

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EMAIL_QUEUE = process.env.RABBITMQ_QUEUE || "vettly.email";

const RETRY_QUEUE = `${EMAIL_QUEUE}.retry`;
const DEAD_QUEUE = `${EMAIL_QUEUE}.dlq`;
const DEAD_EXCHANGE = `${EMAIL_QUEUE}.dead`;

let connection;
let channel;
let connecting;

export async function connectRabbitMQ() {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    if (!RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL is not configured.");
    }

    const conn = await amqp.connect(RABBITMQ_URL);

    try {
      conn.on("error", (error) => {
        console.error("RabbitMQ connection error:", error.message);
      });

      conn.on("close", () => {
        connection = undefined;
        channel = undefined;
        console.warn("RabbitMQ connection closed.");
      });

      const ch = await conn.createConfirmChannel();

      await ch.assertExchange(DEAD_EXCHANGE, "direct", {
        durable: true,
      });

      await ch.assertQueue(DEAD_QUEUE, { durable: true });

      await ch.bindQueue(DEAD_QUEUE, DEAD_EXCHANGE, "dead");

      await ch.assertQueue(EMAIL_QUEUE, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": DEAD_EXCHANGE,
          "x-dead-letter-routing-key": "dead",
        },
      });

      await ch.assertQueue(RETRY_QUEUE, {
        durable: true,
        arguments: {
          "x-message-ttl": 30000,
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": EMAIL_QUEUE,
        },
      });

      connection = conn;
      channel = ch;

      console.log("RabbitMQ connected.");
      console.log(`Email queue: ${EMAIL_QUEUE}`);

      return ch;
    } catch (error) {
      await conn.close().catch(() => {});
      throw error;
    }
  })();

  try {
    return await connecting;
  } finally {
    connecting = undefined;
  }
}

export async function publishEmailJob(job) {
  const ch = channel || await connectRabbitMQ();

  const accepted = ch.sendToQueue(
    EMAIL_QUEUE,
    Buffer.from(JSON.stringify(job)),
    {
      persistent: true,
      contentType: "application/json",
      messageId: crypto.randomUUID(),
    },
  );

  // Wait until RabbitMQ confirms the published message.
  await ch.waitForConfirms();

  if (!accepted) {
    console.warn("RabbitMQ publisher backpressure detected.");
  }
}

export async function closeRabbitMQ() {
  const ch = channel;
  const conn = connection;

  channel = undefined;
  connection = undefined;

  if (ch) await ch.close().catch(() => {});
  if (conn) await conn.close().catch(() => {});
}
