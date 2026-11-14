import { renderEmailLayout } from "./layout.template.js";

export function renderVerificationEmail({ name, verificationUrl, expiresIn }) {
  return renderEmailLayout({
    preheader: `Verify your email address. This link expires in ${expiresIn}.`,
    category: "Account verification",
    title: "One last step.",
    greeting: `Hi ${name},`,
    intro: "Confirm your email address to finish setting up your Vettly account and start creating interviews.",
    action: "Verify email address",
    url: verificationUrl,
    footnote: `This link expires in ${expiresIn}. If you did not create a Vettly account, you can ignore this message.`,
  });
}
