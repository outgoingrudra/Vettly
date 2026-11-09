# Vettly authentication

Run `npm ci` and `npm run dev` in this directory. The dev server listens on localhost:3000 and proxies /api to the existing API on localhost:4000. Set FRONTEND_URL on the API to the browser origin so verification and reset emails return here.

For production, run `npm run build`, serve dist, forward /api to the API and rewrite frontend paths to index.html. Alternatively set VITE_API_BASE_URL to the full API base ending in /api/v1 at build time. The API must allow credentials from the frontend origin.

- src/AuthForm.jsx handles sign-in, signup, verification, resending an email, and password recovery.
- src/main.jsx handles page selection, session checks, the account screen and theme selection.
- src/api.js sends requests with the API's session cookie.
- src/Studio.jsx, src/Terminal.jsx and src/Landscape.jsx draw the themed interview scene. src/styles.css defines Paper, Clay and Night themes.

Email links open /verify-email?token=… and /reset-password?token=…. Sign-in opens /account. Theme choice is stored in the browser.

The public landing page at / includes a local sample interview walkthrough. Its invitation, question, and result are illustrative. Sign in at /login or register at /signup. Landing.jsx and landing.css own the public layout.

## Reviewing an interview

Open an interview from the host dashboard. Search its candidates by name or email and choose **Review attempt**. A submitted attempt includes the MCQ breakdown and the candidate’s current profile. Proctoring events have their own review status. Close entry and wait for active attempts to finish or expire before publishing individual scorecards.

- `src/pages/host/CandidateRoster.jsx` lists and searches the interview’s candidates.
- `src/pages/host/ShareInvitation.jsx` makes a downloadable QR code in the browser and offers browser and WhatsApp sharing for the join link.
- `src/pages/host/AttemptReview.jsx` shows proctoring activity, profile access, feedback, publication and email retries.
- `src/pages/host/useReviewRequest.js` loads review data and ignores obsolete responses when navigating.
- `src/pages/Scorecard.jsx` renders the answer breakdown and the signed-in result page at `/results/:attemptId`. The candidate dashboard and publication email link to this page.

## Account files

`src/pages/Account.jsx` lets a signed-in user upload, replace, and remove a profile picture or PDF résumé through the API's ImageKit endpoints. `src/pages/account.css` styles these controls. `src/api.js` sends multipart uploads with the session cookie. The account reads `GET /auth/profiles/:userId` for the current files, including a short-lived résumé link.
The profile route uses a full-width layout, and its navbar shows the user's picture or initial. The picture in the navbar refreshes after an upload or removal.
The profile card also edits the user's name through `PATCH /auth/me`. A successful save updates the shared user and profile state immediately.
`src/pages/ProfileSessions.jsx` lists active sessions, identifies the current device, revokes one session, and signs out all devices through the existing auth endpoints. The security card also links to password reset.
`src/pages/host/JoinInvitation.jsx` lets candidates open a host invitation from their dashboard. It accepts a local interview URL or an interview ID and navigates to the existing join screen.
The candidate dashboard reads server-calculated totals for all attempts, active attempts, submitted results awaiting publication, and published results. Its Refresh results button bypasses the short-lived GET cache.

## Interview controls

The draft editor exposes the API's optional description, scheduled start, and participant limit. The host roster refreshes every ten seconds while entry is open, shows video synchronization failures, and can retry a candidate's access. The event review screen shows details and saves notes with each status change. `src/pages/candidate/VideoRoom.jsx` uses Stream's call controls and displays the connection error when joining fails.
The roster ignores responses from older refresh requests. The video room checks for a secure browser context before requesting a Stream token, so an unsupported connection gives an actionable message.
The roster shows submitted marks against the interview maximum, warning counts, and submission times so hosts can compare candidates before opening detailed reviews.
The candidate invitation refreshes attempt status after a failed join and shows the remaining time when an attempt has already started. It uses the API's server time to keep the countdown aligned with the submission deadline.
If final submission returns a conflict or loses its response, the assessment checks the attempt status before clearing saved answers. If status cannot be confirmed, candidates can retry the status check while their selections remain in this tab.

## Navigation

`src/components/Frame.jsx` chooses the landing navbar for the home page and the compact app navbar for the dashboard, interview, account, and authentication pages. `src/components/AppNav.css` styles the app navbar. Theme selection works in both navbars.
`src/navigation.js` handles same-origin links through browser history. The app listens for navigation and back/forward events, while external links, downloads, and modified clicks retain normal browser behavior.
Back links sit in the page content for host interview details, the candidate invitation and assessment, the profile page, and the scorecard. The dashboard keeps its navigation without a Back button. An active assessment explains that its timer continues if the candidate leaves.
The app keeps the signed-in user, profile, and session list in its root state while navigating. Profile uploads and removals refresh the profile, session changes update or clear the session list, and signing out clears all three. The sessions card also has a manual refresh control.
The API client shares recent GET responses across interview pages for 30 seconds and combines simultaneous requests for the same URL. Writes clear that cache. Join previews and authentication requests always go to the server, and live roster polling or explicit refreshes fetch fresh data.
