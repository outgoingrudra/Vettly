
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import interviewService from "../services/interviewService.js";
import "./CandidateInterview.css";

function InterviewAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [attempt, setAttempt] = useState(
    location.state?.attempt || null
  );

  const [questions, setQuestions] = useState(
    location.state?.questions || []
  );

  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(!location.state?.attempt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadAttempt() {
      if (attempt && questions.length > 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await interviewService.joinInterview(id);
        const data = response?.data ?? response;

        if (!data?.attempt?.id) {
          throw new Error("Attempt information not found.");
        }

        setAttempt(data.attempt);
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err.message || "Unable to load interview questions.");
      } finally {
        setLoading(false);
      }
    }

    loadAttempt();
  }, [id]);

  function handleAnswer(questionId, selectedOption) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedOption,
    }));
  }

  async function handleSubmit() {
    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formattedAnswers = questions.map((question) => ({
        questionId: question.id,
        selectedOption: answers[question.id],
      }));

      await interviewService.submitAttempt(
        attempt.id,
        formattedAnswers
      );

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit your interview.");
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0
      ? (answeredCount / totalQuestions) * 100
      : 0;

  if (loading) {
    return (
      <div className="candidate-page-state">
        <div className="candidate-loader"></div>
        <p>Loading your interview questions...</p>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="candidate-page-state">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate("/interviews")}>
          Back to Interviews
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="candidate-page-wrapper">
        <div className="candidate-attempt-page candidate-success-page">
          <div className="candidate-success-icon">✓</div>

          <span className="candidate-eyebrow">
            SUBMISSION COMPLETE
          </span>

          <h2>Interview Submitted Successfully!</h2>

          <p>
            Congratulations! Your answers have been submitted
            successfully.
          </p>

          <div className="candidate-success-details">
            <strong>{answeredCount} / {totalQuestions}</strong>
            <span>Questions answered</span>
          </div>

          <p className="candidate-result-note">
            Your result will be available after the host publishes it.
          </p>

          <button
            className="candidate-start-button"
            onClick={() => navigate("/interviews")}
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-page-wrapper">
      <div className="candidate-attempt-page">

        <div className="attempt-topbar">
          <div>
            <span className="candidate-eyebrow">
              CANDIDATE PORTAL
            </span>
            <h2>Interview Assessment</h2>
          </div>

          <span className="attempt-live-badge">
            IN PROGRESS
          </span>
        </div>

        <div className="attempt-progress-section">
          <div className="attempt-progress-info">
            <span>YOUR PROGRESS</span>
            <strong>
              {answeredCount} of {totalQuestions} answered
            </strong>
          </div>

          <div className="attempt-progress-track">
            <div
              className="attempt-progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="attempt-stats">
            <div>
              <strong>{totalQuestions}</strong>
              <span>Total Questions</span>
            </div>

            <div>
              <strong>{answeredCount}</strong>
              <span>Answered</span>
            </div>

            <div>
              <strong>{totalQuestions - answeredCount}</strong>
              <span>Remaining</span>
            </div>
          </div>
        </div>

        <div className="attempt-instructions">
          <span>ℹ</span>
          Select one answer for each question. All questions
          must be answered before submission.
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <div className="attempt-questions-list">
          {questions.map((question, index) => (
            <div
              className="candidate-question-card"
              key={question.id}
            >
              <div className="attempt-question-heading">
                <span className="attempt-question-number">
                  QUESTION {String(index + 1).padStart(2, "0")}
                </span>

                <span className="attempt-question-marks">
                  {question.marks} Marks
                </span>
              </div>

              <h3>{question.prompt}</h3>

              <div className="attempt-options">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={
                      answers[question.id] === optionIndex
                        ? "attempt-option selected"
                        : "attempt-option"
                    }
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={
                        answers[question.id] === optionIndex
                      }
                      onChange={() =>
                        handleAnswer(question.id, optionIndex)
                      }
                    />

                    <span className="attempt-option-letter">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>

                    <span className="attempt-option-text">
                      {option}
                    </span>

                    {answers[question.id] === optionIndex && (
                      <span className="attempt-selected-check">
                        ✓
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="attempt-submit-section">
          <div>
            <h3>Ready to submit?</h3>
            <p>
              {answeredCount === totalQuestions
                ? "You've answered every question. You can submit now."
                : `${totalQuestions - answeredCount} question(s) still need an answer.`}
            </p>
          </div>

          <button
            className="candidate-start-button"
            onClick={handleSubmit}
            disabled={submitting || totalQuestions === 0}
          >
            {submitting ? "Submitting..." : "Submit Interview →"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default InterviewAttempt;
