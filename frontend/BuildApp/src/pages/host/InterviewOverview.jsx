import { ProctoringSummary } from "../../components/ProctoringSettings";
import React, { lazy, Suspense, useState } from "react";
import { request } from "../../api";
import CandidateRoster from "./CandidateRoster";
import ShareInvitation from "./ShareInvitation";
import { hostPath, formatName, statusName, problem } from "./host";

const VideoRoom = lazy(() => import("../candidate/VideoRoom"));

export default function InterviewOverview({ interview, update }) {
  const {
    id,
    title,
    status,
    format,
    durationMinutes,
    instructions,
    questions = [],
  } = interview;
  const [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [email, setEmail] = useState("");
  const draft = status === "DRAFT",
    open = status === "PUBLISHED",
    live = format === "LIVE";
  const joinUrl = new URL(
    "/interviews/" + encodeURIComponent(id) + "/join",
    location.origin,
  ).href;
  async function run(action, callback) {
    if (busy) return;
    setBusy(action);
    setMessage("");
    setError("");
    try {
      await callback();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy("");
    }
  }
  async function setupVideo() {
    await request("/stream/" + id + "/setup", {});
    const latest = await request("/interviews/" + id);
    update(latest.data.interview);
    setMessage("The video room is ready.");
  }
  async function start() {
    const r = await request("/interviews/" + id + "/publish", {}, "PATCH");
    update({ ...interview, ...r.data.interview, questions });
    if (live) await setupVideo();
    else setMessage("Entry is open.");
  }
  return (
    <section>
      <div className="workspace-heading">
        <div>
          <p className="lifecycle">{statusName[status]}</p>
          <h1>{title}</h1>
        </div>
        {draft && <a href={hostPath(id) + "/edit"}>Edit draft</a>}
      </div>
      <p className="metadata">
        {formatName[format]} · {durationMinutes} minutes · {questions.length}{" "}
        questions
        {interview.scheduledAt &&
          " · Starts " + new Date(interview.scheduledAt).toLocaleString()}
        {interview.maxParticipants &&
          " · " + interview.maxParticipants + " places"}
      </p>
      {interview.description && (
        <p className="instructions">{interview.description}</p>
      )}
      {live && (open || inRoom) && interview.streamCallId && (
        <section>
          <button onClick={() => setInRoom(!inRoom)}>
            {inRoom ? "Leave video room" : "Join video room"}
          </button>
          {inRoom && (
            <Suspense fallback={<p>Opening video…</p>}>
              <VideoRoom id={id} />
            </Suspense>
          )}
        </section>
      )}
      <div className="overview-grid">
        <article>
          <h2>Assessment brief</h2>
          <p className="instructions">
            {instructions || "No candidate instructions added."}
          </p>
          <h2>Proctoring</h2>
          <ProctoringSummary settings={interview} />
          <h2>Answer key</h2>
          {questions.length === 0 ? (
            <p>No questions added yet.</p>
          ) : (
            <ol className="answer-key">
              {questions.map((q) => (
                <li key={q.id}>
                  <strong>{q.prompt}</strong>
                  <p>
                    {q.options[q.correctOption]} · {q.marks}{" "}
                    {q.marks === 1 ? "mark" : "marks"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </article>
        <aside className="host-controls">
          <section>
            <h2>Candidate access</h2>
            {draft && (
              <>
                <p>
                  Starting locks the questions and duration.
                  {!live && !questions.length
                    ? " Add a question before opening entry."
                    : ""}
                </p>
                <button
                  className="action"
                  disabled={!!busy || (!live && !questions.length)}
                  onClick={() => run("start", start)}
                >
                  {busy === "start" ? "Starting…" : "Start interview"}
                </button>
              </>
            )}
            {open && (
              <p>
                {live && !interview.streamCallId
                  ? "Interview started. Set up the video room to admit candidates."
                  : "Candidates can now join with their link."}
              </p>
            )}
            {open && (
              <button
                disabled={!!busy}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Close entry? Candidates who already started can still submit until their deadline.",
                    )
                  )
                    return;
                  run("archive", async () => {
                    const response = await request(
                      "/interviews/" + id + "/archive",
                      {},
                      "PATCH",
                    );
                    update({
                      ...interview,
                      ...response.data.interview,
                      questions,
                    });
                  });
                }}
              >
                Close entry
              </button>
            )}
            {open && live && !interview.streamCallId && (
              <button
                disabled={!!busy}
                onClick={() => run("video", setupVideo)}
              >
                Set up video room
              </button>
            )}
            {status === "ARCHIVED" && <p>Entry is closed to new candidates.</p>}
          </section>
          {status !== "ARCHIVED" && (
            <section>
              <h2>Share invitation</h2>
              <label>
                Join link
                <input
                  readOnly
                  value={joinUrl}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                disabled={!!busy}
                onClick={() =>
                  run("copy", async () => {
                    try {
                      await navigator.clipboard.writeText(joinUrl);
                      setMessage("Join link copied.");
                    } catch {
                      setError("Select the join link and copy it manually.");
                    }
                  })
                }
              >
                Copy link
              </button>
              <ShareInvitation title={title} url={joinUrl} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("invite", async () => {
                    await request("/interviews/" + id + "/participants", {
                      email: email.trim(),
                    });
                    setMessage("Invitation queued for " + email + ".");
                    setEmail("");
                  });
                }}
              >
                <label>
                  Candidate email
                  <input
                    type="email"
                    required
                    maxLength="254"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button disabled={!!busy}>
                  {busy === "invite" ? "Sending…" : "Send invitation"}
                </button>
              </form>
            </section>
          )}
          {message && <p role="status">{message}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </aside>
      </div>
      {!draft && <CandidateRoster interview={interview} />}
    </section>
  );
}
