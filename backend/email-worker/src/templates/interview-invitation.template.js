import { renderEmailLayout } from "./layout.template.js";

export function renderInterviewInvitationEmail({ url, interviewTitle, hostName }) {
  const interview = interviewTitle ? `“${interviewTitle}”` : "an interview";
  const sender = hostName ? `${hostName} has invited you` : "You have been invited";
  return renderEmailLayout({
    preheader: "You have been invited to a Vettly interview.",
    category: "Interview invitation",
    title: "You’re invited.",
    greeting: "Hello,",
    intro: `${sender} to take part in ${interview} on Vettly. Open the invitation to review the details before joining.`,
    detail: "You will need to sign in before you can start. Your timer begins only when you join the interview.",
    action: "View invitation",
    url,
    footnote: "If you were not expecting this invitation, you can ignore this message.",
  });
}
