
import { sendEmail } from "./email.service.js";
import { renderVerificationEmail } from "../templates/verification.template.js";
import { renderPasswordResetEmail } from "../templates/password-reset.template.js";

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
  expiresIn = "30 minutes",
}) {
  const html = renderVerificationEmail({
    name,
    verificationUrl,
    expiresIn,
  });

  return sendEmail({
    to,
    subject: "Verify your Vettly email address",
    html,
    text: [
      `Hi ${name},`,
      "",
      "Please verify your Vettly email address to complete registration.",
      `Verification link: ${verificationUrl}`,
      `This link expires in ${expiresIn}.`,
      "",
      "If you didn't create a Vettly account, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresIn = "15 minutes",
}) {
  const html = renderPasswordResetEmail({
    name,
    resetUrl,
    expiresIn,
  });

  return sendEmail({
    to,
    subject: "Reset your Vettly password",
    html,
    text: [
      `Hi ${name},`,
      "",
      "We received a request to reset your Vettly password.",
      `Reset your password here: ${resetUrl}`,
      `This link expires in ${expiresIn} and should only be used once.`,
      "",
      "If you didn't request this, ignore this email. Your password will remain unchanged.",
    ].join("\n"),
  });
}
