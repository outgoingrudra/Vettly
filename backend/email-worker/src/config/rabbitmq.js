
import amqp from "amqplib";
import { env } from "./env.js";

let connection;
let channel;

export const queueNames = Object.freeze({
  main: env.RABBITMQ_QUEUE,
  retry: `${env.RABBITMQ_QUEUE}.retry`,
  dead: `${env.RABBITMQ_QUEUE}.dlq`,
});

const deadExchange = `${env.RABBITMQ_QUEUE}.dead`;

export async function connectRabbitMQ() {
  connection = await amqp.connect(env.RABBITMQ_URL);

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error.message);
  });

  connection.on("close", () => {
    console.error("RabbitMQ connection closed.");
  });

  channel = await connection.createConfirmChannel();

  await channel.assertExchange(deadExchange, "direct", {
    durable: true,
  });

  await channel.assertQueue(queueNames.dead, {
    durable: true,
  });

  await channel.bindQueue(queueNames.dead, deadExchange, "dead");

  await channel.assertQueue(queueNames.main, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": deadExchange,
      "x-dead-letter-routing-key": "dead",
    },
  });

  await channel.assertQueue(queueNames.retry, {
    durable: true,
    arguments: {
      "x-message-ttl": 30000,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": queueNames.main,
    },
  });

  await channel.prefetch(1);

  console.log("✅ RabbitMQ connected.");
  console.log(`📥 Main queue: ${queueNames.main}`);
  console.log(`🔁 Retry queue: ${queueNames.retry}`);
  console.log(`🗃️ Dead-letter queue: ${queueNames.dead}`);

  return channel;
}

export function getRabbitChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel has not been initialized.");
  }

  return channel;
}
