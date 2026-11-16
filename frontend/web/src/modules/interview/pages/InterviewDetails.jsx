
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import interviewService from "../services/interviewService.js";

function InterviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInterview();
  }, [id]);

  async function loadInterview() {
    setLoading(true);
    setError("");

    try {
      const response = await interviewService.getInterview(id);

      console.log("FULL API RESPONSE:", response);
      console.log("INTERVIEW DATA:", response?.data?.interview);
      console.log(
        "QUESTIONS FROM API:",
        response?.data?.interview?.questions
      );

      const interviewData =
        response?.data?.interview ?? response?.data;

      if (!interviewData) {
        throw new Error("Interview details not found.");
      }

      setInterview(interviewData);
    } catch (err) {
      console.error("Interview details error:", err);
      setError(err.message || "Unable to load interview details.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    const confirmed = window.confirm(
      "Are you sure you want to publish this interview?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await interviewService.publishInterview(id);

      setMessage("Interview published successfully.");
      await loadInterview();
    } catch (err) {
      setError(err.message || "Unable to publish interview.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    const confirmed = window.confirm(
      "Are you sure you want to archive this interview?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await interviewService.archiveInterview(id);

      setMessage("Interview archived successfully.");
      await loadInterview();
    } catch (err) {
      setError(err.message || "Unable to archive interview.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this draft interview? This action cannot be undone."
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      await interviewService.deleteInterview(id);

      navigate("/interviews", {
        state: {
          message: "Interview deleted successfully.",
        },
      });
    } catch (err) {
      setError(err.message || "Unable to delete interview.");
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Not scheduled";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  }

  if (loading) {
    return <div className="dashboard-message">Loading interview details...</div>;
  }

  if (error && !interview) {
    return (
      <div className="content-panel">
        <p>{error}</p>

        <button onClick={() => navigate("/interviews")}>
          Back to Interviews
        </button>

        <button onClick={loadInterview}>
          Try Again
        </button>
      </div>
    );
  }

  if (!interview) return null;
  console.log("INTERVIEW STATUS:", interview.status);

  return (
    <div className="interview-management">
      <button onClick={() => navigate("/interviews")}>
        ← Back to Interviews
      </button>

      <div className="content-panel">
        <h1>{interview.title}</h1>

        <p>
          {interview.description || "No description provided."}
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
          <strong>Duration:</strong> {interview.durationMinutes} minutes
        </p>

        <p>
          <strong>Scheduled At:</strong>{" "}
          {formatDate(interview.scheduledAt)}
        </p>

        <p>
          <strong>Maximum Participants:</strong>{" "}
          {interview.maxParticipants ?? "No limit"}
        </p>

        <p>
          <strong>Created At:</strong>{" "}
          {formatDate(interview.createdAt)}
        </p>

        <hr />

        <h3>Instructions</h3>

        <p>
          {interview.instructions || "No instructions provided."}
        </p>

        <hr />


        <div
          style={{
            marginTop: "25px",
            padding: "20px",
            border: "1px solid #334155",
            borderRadius: "12px",
          }}
        >
          <h3>Interview Management</h3>

          <p style={{ color: "yellow" }}>
            Current Status: {JSON.stringify(interview.status)}
          </p>

          <p style={{ color: "cyan" }}>
            Published Condition: {String(interview.status === "PUBLISHED")}
          </p>

          {message && <p>{message}</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {interview.status === "DRAFT" ? (
            <>
              <p>This interview is currently a draft.</p>

              <button
                type="button"
                onClick={handlePublish}
                disabled={actionLoading}
                style={{
                  display: "inline-block",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  padding: "12px 24px",
                  margin: "8px 10px 8px 0",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Publishing..." : "Publish Interview"}
              </button>



              <button
                type="button"
                onClick={() => navigate(`/interviews/${id}/edit`)}
                style={{
                  display: "inline-block",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "12px 24px",
                  margin: "8px 10px 8px 0",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Edit Interview
              </button>

              <button onClick={() => navigate(`/interviews/${id}/questions`)}>
                Manage Questions
              </button>



              <button
                type="button"
                onClick={handleArchive}
                disabled={actionLoading}
                style={{
                  display: "inline-block",
                  background: "#dc2626",
                  color: "#ffffff",
                  padding: "12px 24px",
                  marginTop: "15px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Archiving..." : "Archive Interview"}
              </button>


              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                style={{
                  display: "inline-block",
                  background: "#dc2626",
                  color: "#ffffff",
                  padding: "12px 24px",
                  marginTop: "15px",
                  marginLeft: "10px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Deleting..." : "Delete Interview"}
              </button>
            </>
          ) : null}


          {interview?.format === "LIVE" &&
            interview?.status === "PUBLISHED" && (
              <button
                type="button"
                onClick={() => navigate(`/interviews/${id}/video`)}
              >
                Join live interview
              </button>
            )}

          {interview.status === "PUBLISHED" && (
            <div style={{ marginTop: "20px" }}>
              <p style={{ color: "#ffffff", marginBottom: "15px" }}>
                This interview is published and available to candidates.
              </p>

              <button
                type="button"
                onClick={handleArchive}
                disabled={actionLoading}
                style={{
                  display: "block",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  padding: "14px 28px",
                  border: "2px solid #ffffff",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  visibility: "visible",
                  opacity: 1,
                }}
              >
                {actionLoading ? "Archiving..." : "Archive Interview"}
              </button>
            </div>
          )}


          {interview.status === "ARCHIVED" ? (
            <p>This interview has been archived.</p>
          ) : null}
        </div>


      </div>


      {/* QUESTIONS PREVIEW */}

      <div className="interview-questions-preview">
        <hr />

        <h3>Questions & Answers</h3>

        <p>
          Total Questions:{" "}
          {Array.isArray(interview.questions)
            ? interview.questions.length
            : 0}
        </p>

        {Array.isArray(interview.questions) &&
          interview.questions.length > 0 ? (
          <>
            <p>
              Total Marks:{" "}
              {interview.questions.reduce(
                (total, question) =>
                  total + Number(question.marks || 1),
                0
              )}
            </p>

            {interview.questions.map((question, index) => (
              <div className="question-card" key={question.id || index}>
                <h4>
                  Question {index + 1}
                  <span> ({question.marks || 1} Marks)</span>
                </h4>

                <p>{question.prompt}</p>

                <ol type="A">
                  {question.options.map((option, optionIndex) => (
                    <li
                      key={optionIndex}
                      className={
                        optionIndex === question.correctOption
                          ? "correct-answer"
                          : ""
                      }
                    >
                      {option}

                      {optionIndex === question.correctOption && (
                        <strong> ✓ Correct Answer</strong>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </>
        ) : (
          <p>No questions have been added to this interview yet.</p>
        )}
      </div>

    </div>
  );
}

export default InterviewDetails;
