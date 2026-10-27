
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startEmailConsumer } from "./consumers/email.consumer.js";

async function startWorker() {
  console.log("Starting Vettly Email Worker...");

  await connectRabbitMQ();
  await startEmailConsumer();

  console.log("🚀 Vettly Email Worker is running.");
}

startWorker().catch((error) => {
  console.error("❌ Email Worker startup failed:", error.message);
  process.exitCode = 1;
});
