
import { sendEmail } from "./email.service.js";
import { renderWelcomeEmail } from "../templates/welcome.template.js";

export async function sendWelcomeEmail({ to, name }) {
  const html = renderWelcomeEmail({ name });

  return sendEmail({
    to,
    subject: "Welcome to Vettly",
    html,
    text: `Welcome to Vettly, ${name}! Your account has been created successfully.`,
  });
}
