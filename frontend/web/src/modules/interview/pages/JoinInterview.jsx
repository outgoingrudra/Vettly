
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import interviewService from "../services/interviewService.js";

function JoinInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInterview();
  }, [id]);

  async function loadInterview() {
    setLoading(true);
    setError("");

    try {
      const response = await interviewService.previewInterview(id);

      if (!response?.interview) {
        throw new Error("Interview details could not be loaded.");
      }

      setInterview(response.interview);
      setAttempt(response.attempt ?? null);
    } catch (err) {
      console.error("Interview preview error:", err);
      setError(err.message || "Unable to load interview.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "Not scheduled";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  }

  function getAttemptMessage() {
    if (!attempt) return null;

    if (attempt.status === "IN_PROGRESS") {
      if (new Date(attempt.deadline) <= new Date()) {
        return "Your assessment time has expired.";
      }

      return "You already have an active attempt. You can resume it.";
    }

    if (attempt.status === "SUBMITTED") {
      return "You have already submitted this assessment.";
    }

    if (attempt.status === "COMPLETED") {
      return "This assessment has already been completed.";
    }

    if (attempt.status === "ABANDONED") {
      return "Your previous attempt was terminated.";
    }

    return null;
  }

  function canJoin() {
    if (!interview) return false;

    if (interview.status !== "PUBLISHED") return false;

    if (
      attempt &&
      attempt.status !== "NOT_STARTED" &&
      attempt.status !== "IN_PROGRESS"
    ) {
      return false;
    }

    if (
      attempt?.status === "IN_PROGRESS" &&
      new Date(attempt.deadline) <= new Date()
    ) {
      return false;
    }

    if (
      interview.scheduledAt &&
      new Date(interview.scheduledAt) > new Date()
    ) {
      return false;
    }

    if (
      interview.format === "LIVE" &&
      !interview.streamCallId
    ) {
      return false;
    }

    return true;
  }

  async function handleJoin() {
    if (!canJoin()) return;

    setJoining(true);
    setError("");

    try {
      const response = await interviewService.joinInterview(id);

      if (!response?.success || !response?.attempt?.id) {
        throw new Error("The server did not return a valid attempt.");
      }

      const roomState = {
        attempt: response.attempt,
        questions: response.questions ?? [],
        warningCount: response.warningCount ?? 0,
        serverTime: response.serverTime,
      };

      if (interview.format === "LIVE") {
        navigate(`/interviews/${id}/video`, {
          state: roomState,
        });
      } else {
        navigate(`/interviews/${id}/room`, {
          state: roomState,
        });
      }
    } catch (err) {
      console.error("Join interview error:", err);
      setError(err.message || "Unable to join this interview.");
      await loadInterview();
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-message">
        Loading interview details...
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="content-panel">
        <h2>Unable to open interview</h2>
        <p>{error}</p>

        <button type="button" onClick={loadInterview}>
          Try Again
        </button>

        <button
          type="button"
          onClick={() => navigate("/interviews")}
        >
          Back to Interviews
        </button>
      </div>
    );
  }

  if (!interview) return null;

  const available = canJoin();
  const attemptMessage = getAttemptMessage();

  return (
    <div className="interview-management">
      <div className="content-panel">
        <button
          type="button"
          onClick={() => navigate("/interviews")}
        >
          ← Back to Interviews
        </button>

        <h1>{interview.title}</h1>

        <p>
          {interview.instructions ||
            "Please read the interview information before starting."}
        </p>

        <hr />

        <h3>Interview Information</h3>

        <p>
          <strong>Status:</strong> {interview.status}
        </p>

        <p>
          <strong>Format:</strong> {interview.format}
        </p>

        <p>
          <strong>Duration:</strong>{" "}
          {interview.durationMinutes} minutes
        </p>

        <p>
          <strong>Scheduled time:</strong>{" "}
          {formatDate(interview.scheduledAt)}
        </p>

        <hr />

        <h3>Before you begin</h3>

        <ul>
          <li>Make sure you have a stable internet connection.</li>
          <li>Read all instructions carefully.</li>
          <li>Do not refresh or close the assessment unnecessarily.</li>
          <li>Your attempt is subject to the configured time limit.</li>
          {interview.format === "LIVE" && (
            <li>Allow camera and microphone access when requested.</li>
          )}
        </ul>

        {attemptMessage && (
          <p className="form-error">{attemptMessage}</p>
        )}

        {error && (
          <p className="form-error">{error}</p>
        )}

        {interview.status !== "PUBLISHED" && (
          <p className="form-error">
            This interview is not currently available to candidates.
          </p>
        )}

        {interview.scheduledAt &&
          new Date(interview.scheduledAt) > new Date() && (
            <p>
              This interview has not started yet. Please return at
              the scheduled time.
            </p>
          )}

        {interview.format === "LIVE" &&
          !interview.streamCallId && (
            <p className="form-error">
              The live video room is not ready yet. Please contact
              the host.
            </p>
          )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleJoin}
          disabled={!available || joining}
        >
          {joining
            ? "Joining..."
            : attempt?.status === "IN_PROGRESS"
              ? "Resume Interview"
              : interview.format === "LIVE"
                ? "Join Live Interview"
                : "Start Assessment"}
        </button>
      </div>
    </div>
  );
}

export default JoinInterview;
