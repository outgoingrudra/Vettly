
import "dotenv/config";
import { connectRabbitMQ } from "../config/rabbitmq.js";
import { sendEmail } from "../services/email.service.js";

const EMAIL_QUEUE = process.env.RABBITMQ_QUEUE || "vettly.email";
const RETRY_QUEUE = `${EMAIL_QUEUE}.retry`;

const MAX_RETRIES = 3;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

async function processEmail(job) {
  const { type, to, data = {} } = job;

  if (!to) {
    throw new Error("Recipient email is missing.");
  }

  const name = escapeHtml(data.name || "User");

  switch (type) {
    case "password_reset": {
      if (!data.resetUrl) {
        throw new Error("Password reset URL is missing.");
      }

      await sendEmail({
        to,
        subject: "Reset your Vettly password",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your Vettly password.</p>
            <p>Click the button below to reset your password:</p>
            <a
              href="${escapeHtml(data.resetUrl)}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Reset Password
            </a>
            <p>This link expires in ${escapeHtml(
              data.expiresIn || "15 minutes"
            )}.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Regards,<br/>Vettly Team</p>
          </div>
        `,
      });

      break;
    }

    case "verification": {
      if (!data.verificationUrl) {
        throw new Error("Verification URL is missing.");
      }

      await sendEmail({
        to,
        subject: "Verify your Vettly account",
        html: `
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with Vettly.</p>
          <p>
            <a href="${escapeHtml(data.verificationUrl)}">
              Verify your email
            </a>
          </p>
          <p>This link expires in ${escapeHtml(
            data.expiresIn || "30 minutes"
          )}.</p>
          <p>Regards,<br/>Vettly Team</p>
        `,
      });

      break;
    }

    case "welcome": {
      await sendEmail({
        to,
        subject: "Welcome to Vettly!",
        html: `
          <h2>Welcome to Vettly, ${name}!</h2>
          <p>Your email has been successfully verified.</p>
          <p>Thank you for joining us.</p>
          <p>Regards,<br/>Vettly Team</p>
        `,
      });

      break;
    }

    default:
      throw new Error(`Unknown email job type: ${type}`);
  }

  console.log(`Email sent: ${type} -> ${to}`);
}

async function startEmailWorker() {
  const channel = await connectRabbitMQ();

  await channel.prefetch(5);

  await channel.consume(EMAIL_QUEUE, async (message) => {
    if (!message) return;

    try {
      const job = JSON.parse(message.content.toString());

      await processEmail(job);

      channel.ack(message);
    } catch (error) {
      console.error("Email worker error:", error.message);

      const retryCount = Number(
        message.properties.headers?.["x-retry-count"] || 0
      );

      if (retryCount < MAX_RETRIES) {
        try {
          channel.sendToQueue(
            RETRY_QUEUE,
            message.content,
            {
              persistent: true,
              contentType: "application/json",
              messageId: message.properties.messageId,
              headers: {
                ...message.properties.headers,
                "x-retry-count": retryCount + 1,
              },
            }
          );

          await channel.waitForConfirms();
          channel.ack(message);

          console.log(
            `Retry scheduled: ${retryCount + 1}/${MAX_RETRIES}`
          );
        } catch (retryError) {
          console.error("Retry scheduling failed:", retryError.message);
          channel.nack(message, false, true);
        }
      } else {
        console.error("Maximum retries reached. Moving to DLQ.");
        channel.nack(message, false, false);
      }
    }
  });

  console.log(`Vettly email worker listening on ${EMAIL_QUEUE}`);
}

startEmailWorker().catch((error) => {
  console.error("Failed to start email worker:", error);
  process.exit(1);
});
