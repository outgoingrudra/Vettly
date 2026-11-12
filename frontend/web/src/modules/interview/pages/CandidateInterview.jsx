
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import interviewService from "../services/interviewService.js";
import "./CandidateInterview.css";

function CandidateInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        const response = await interviewService.previewInterview(id);

        const data =
          response?.interview ??
          response?.data?.interview ??
          response?.data ??
          response;

        setInterview(data);
      } catch (err) {
        setError(err.message || "Failed to load interview.");
      } finally {
        setLoading(false);
      }
    }

    loadInterview();
  }, [id]);

  async function handleStartInterview() {
    try {
      setStarting(true);
      setError("");

      const response = await interviewService.joinInterview(id);

      const attempt = response?.attempt ?? response?.data?.attempt;
      const questions =
        response?.questions ??
        response?.data?.questions ??
        [];

      if (!attempt?.id) {
        throw new Error("Attempt information was not returned.");
      }

      navigate(`/interviews/${id}/attempt`, {
        state: { attempt, questions },
      });
    } catch (err) {
      setError(err.message || "Unable to start interview.");
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="candidate-page-state">
        <div className="candidate-loader"></div>
        <p>Preparing your interview...</p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="candidate-page-state">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="candidate-page-state">
        <h2>Interview not found</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="candidate-page-wrapper">
      <div className="candidate-interview-page">

        <div className="candidate-topbar">
          <button
            className="candidate-back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <span className="candidate-portal-label">
            CANDIDATE PORTAL
          </span>
        </div>

        <div className="candidate-hero">
          <div className="candidate-icon">✦</div>

          <span className="candidate-eyebrow">
            YOUR INTERVIEW AWAITS
          </span>

          <h2>{interview.title}</h2>

          <p className="candidate-description">
            Welcome! Review the interview details and instructions
            carefully before starting your interview.
          </p>

          <span className="candidate-status">
            {interview.status || "PUBLISHED"}
          </span>
        </div>

        <div className="candidate-info-grid">
          <div className="candidate-info-card">
            <span className="candidate-info-icon">◷</span>
            <div>
              <span className="candidate-info-label">DURATION</span>
              <strong>
                {interview.durationMinutes || "--"} Minutes
              </strong>
            </div>
          </div>

          <div className="candidate-info-card">
            <span className="candidate-info-icon">✓</span>
            <div>
              <span className="candidate-info-label">FORMAT</span>
              <strong>
                {interview.format || "Interview"}
              </strong>
            </div>
          </div>
        </div>

        <div className="candidate-instructions">
          <h3>Before You Begin</h3>

          <p>
            {interview.instructions ||
              "Read each question carefully and select the most appropriate answer."}
          </p>

          <ul>
            <li>Make sure you have a stable internet connection.</li>
            <li>Read every question carefully before answering.</li>
            <li>Complete your answers before submitting.</li>
            <li>Do not refresh or close the page during your attempt.</li>
          </ul>
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <div className="candidate-start-section">
          <div>
            <h3>Ready to begin?</h3>
            <p>When you're ready, click the button to start.</p>
          </div>

          <button
            className="candidate-start-button"
            onClick={handleStartInterview}
            disabled={starting}
          >
            {starting ? "Starting Interview..." : "Start Interview →"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CandidateInterview;
