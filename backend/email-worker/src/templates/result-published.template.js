import { renderEmailLayout } from "./layout.template.js";

export function renderResultPublishedEmail({ url, interviewTitle, hostName }) {
  const interview = interviewTitle ? ` for “${interviewTitle}”` : "";
  const publisher = hostName ? `${hostName} has` : "The host has";
  return renderEmailLayout({
    preheader: "Your interview scorecard is ready to view.",
    category: "Interview result",
    title: "Your result is ready.",
    greeting: "Hello,",
    intro: `${publisher} published your interview scorecard${interview}. Sign in to see your answers, marks, and any feedback they shared.`,
    action: "View scorecard",
    url,
    footnote: "Your scorecard stays available in your candidate dashboard after publication.",
  });
}
