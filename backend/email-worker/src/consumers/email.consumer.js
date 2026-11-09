import { sendEmail } from "../services/email.service.js";

import { getRabbitChannel, queueNames } from "../config/rabbitmq.js";
import { emailJobSchema } from "./email.schema.js";
import { sendWelcomeEmail } from "../services/welcome-email.service.js";
import { renderInterviewInvitationEmail } from "../templates/interview-invitation.template.js";
import { renderResultPublishedEmail } from "../templates/result-published.template.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/auth-email.service.js";

const MAX_RETRIES = 3;

async function processEmailJob(job) {
  switch (job.type) {
    case "interview_invitation":
    case "result_published": {
      const invitation = job.type === "interview_invitation";
      const subject = invitation ? "You are invited to an interview" : "Your interview result is available";
      const instruction = invitation ? "Sign in to join your interview." : "Sign in to view your published scorecard.";
      const html = invitation
        ? renderInterviewInvitationEmail(job.data)
        : renderResultPublishedEmail(job.data);
      const context = [
        job.data.interviewTitle && `Interview: ${job.data.interviewTitle}`,
        job.data.hostName && `Host: ${job.data.hostName}`,
      ].filter(Boolean);
      return sendEmail({
        to: job.to,
        subject,
        html,
        text: [...context, instruction, job.data.url].join("\n"),
      });
    }
    case "welcome":
      return sendWelcomeEmail({
        to: job.to,
        name: job.data.name,
      });

    case "verification":
      return sendVerificationEmail({
        to: job.to,
        name: job.data.name,
        verificationUrl: job.data.verificationUrl,
        expiresIn: job.data.expiresIn,
      });

    case "password_reset":
      return sendPasswordResetEmail({
        to: job.to,
        name: job.data.name,
        resetUrl: job.data.resetUrl,
        expiresIn: job.data.expiresIn,
      });

    default:
      throw new Error("Unsupported email type.");
  }
}

export async function startEmailConsumer() {
  const channel = getRabbitChannel();

  await channel.consume(
    queueNames.main,
    async (message) => {
      if (!message) return;

      let job;

      try {
        const raw = JSON.parse(message.content.toString());
        job = emailJobSchema.parse(raw);
      } catch (error) {
        console.error("Invalid email job:", error.message);
        channel.nack(message, false, false);
        return;
      }

      try {
        await processEmailJob(job);
        channel.ack(message);
        console.log(`Email sent successfully: ${job.type}`);
      } catch (error) {
        console.error(`Email job failed (${job.type}):`, error.message);

        const previousRetries =
          Number(message.properties.headers?.["x-retry-count"]) || 0;

        if (previousRetries >= MAX_RETRIES) {
          console.error("Retry limit reached; sending job to DLQ.");
          channel.nack(message, false, false);
          return;
        }

        try {
          const headers = {
            ...message.properties.headers,
            "x-retry-count": previousRetries + 1,
          };

          channel.sendToQueue(queueNames.retry, message.content, {
            persistent: true,
            contentType: message.properties.contentType,
            contentEncoding: message.properties.contentEncoding,
            correlationId: message.properties.correlationId,
            messageId: message.properties.messageId,
            headers,
          });

          await channel.waitForConfirms();
          channel.ack(message);

          console.log(
            `Retry ${previousRetries + 1}/${MAX_RETRIES} scheduled for ${job.type}.`,
          );
        } catch (retryError) {
          console.error("Retry publication failed:", retryError.message);

          try {
            channel.nack(message, false, true);
          } catch {
            // If the channel is closed, RabbitMQ will recover unacked messages.
          }
        }
      }
    },
    { noAck: false },
  );

  console.log("Email consumer started.");
}
