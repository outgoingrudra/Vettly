import { renderEmailLayout } from "./layout.template.js";

export function renderPasswordResetEmail({ name, resetUrl, expiresIn }) {
  return renderEmailLayout({
    preheader: `Reset your Vettly password. The link expires in ${expiresIn}.`,
    category: "Account security",
    title: "Reset your password.",
    greeting: `Hi ${name},`,
    intro: "We received a request to reset your Vettly password. Use the button below to choose a new one.",
    action: "Choose a new password",
    url: resetUrl,
    footnote: `This link expires in ${expiresIn} and can be used once. If you did not request this, you can ignore this message.`,
  });
}
