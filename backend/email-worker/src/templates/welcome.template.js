import { renderEmailLayout } from "./layout.template.js";

export function renderWelcomeEmail({ name }) {
  return renderEmailLayout({
    preheader: "Your Vettly account is ready.",
    category: "Welcome",
    title: "Your interview space is ready.",
    greeting: `Hi ${name},`,
    intro: "Your Vettly account has been created. You can now host an interview or join one with an invitation link.",
    detail: "Set up your profile whenever you are ready. Your résumé is optional and can be updated later.",
  });
}
