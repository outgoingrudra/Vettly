
import transporter from "../config/mail.js";
import { env } from "../config/env.js";

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}) {
  const message = {
    from: env.EMAIL_FROM || {
      name: "Vettly",
      address: env.EMAIL_USER,
    },
    to,
    subject,
    html,
    ...(text ? { text } : {}),
    ...((replyTo || env.EMAIL_REPLY_TO)
      ? { replyTo: replyTo || env.EMAIL_REPLY_TO }
      : {}),
  };

  const result = await transporter.sendMail(message);

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
}
