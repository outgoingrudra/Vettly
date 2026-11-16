
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import interviewService from "../services/interviewService.js";

import ProctoringSettings from "../../proctoring/components/ProctoringSettings.jsx";
import "../styles/interview.css";

function CreateInterview() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    format: "LIVE",
    scheduledAt: "",
    durationMinutes: 30,
    maxParticipants: "",
    warningLimit: 3,
    preventCopyPasteEnabled: true,
    tabSwitchDetectionEnabled: true,
    fullscreenRequired: false,
    faceDetectionEnabled: false,
    multipleFaceDetectionEnabled: false,
    suspiciousGestureDetectionEnabled: false,
    cameraDisconnectDetectionEnabled: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Question Management
  const [questions, setQuestions] = useState([]);

  const [newQuestion, setNewQuestion] = useState({
    prompt: "",
    options: ["", ""],
    correctOption: 0,
    marks: 1,
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }


  function handleProctoringSettingChange(key, value) {
  setFormData((previous) => ({
    ...previous,
    [key]: value,
  }));
}


// Update question fields
function handleQuestionChange(field, value) {
  setNewQuestion((previous) => ({
    ...previous,
    [field]: value,
  }));
}

// Update an individual option
function handleOptionChange(index, value) {
  setNewQuestion((previous) => {
    const updatedOptions = [...previous.options];
    updatedOptions[index] = value;

    return {
      ...previous,
      options: updatedOptions,
    };
  });
}

// Add another option
function addOption() {
  if (newQuestion.options.length >= 6) return;

  setNewQuestion((previous) => ({
    ...previous,
    options: [...previous.options, ""],
  }));
}

// Remove an option
function removeOption(index) {
  if (newQuestion.options.length <= 2) return;

  setNewQuestion((previous) => {
    const updatedOptions = previous.options.filter(
      (_, i) => i !== index
    );

    let correctOption = previous.correctOption;

    if (correctOption === index) {
      correctOption = 0;
    } else if (correctOption > index) {
      correctOption--;
    }

    return {
      ...previous,
      options: updatedOptions,
      correctOption,
    };
  });
}

// Add question to the interview form
function addQuestion() {
  setError("");

  const prompt = newQuestion.prompt.trim();
  const options = newQuestion.options.map((option) =>
    option.trim()
  );

  const marks = Number(newQuestion.marks);
  const correctOption = Number(newQuestion.correctOption);

  if (!prompt) {
    setError("Please enter a question.");
    return;
  }

  if (options.some((option) => !option)) {
    setError("Please fill in all question options.");
    return;
  }

  if (
    new Set(options.map((option) => option.toLowerCase())).size !==
    options.length
  ) {
    setError("Duplicate options are not allowed.");
    return;
  }

  if (!Number.isInteger(marks) || marks < 1 || marks > 1000) {
    setError("Marks must be between 1 and 1000.");
    return;
  }

  if (correctOption < 0 || correctOption >= options.length) {
    setError("Please select a correct answer.");
    return;
  }

  if (questions.length >= 100) {
    setError("Maximum 100 questions are allowed.");
    return;
  }

  setQuestions((previous) => [
    ...previous,
    {
      prompt,
      options,
      correctOption,
      marks,
    },
  ]);

  setNewQuestion({
    prompt: "",
    options: ["", ""],
    correctOption: 0,
    marks: 1,
  });

  setShowQuestionForm(false);
}

// Delete a question
function deleteQuestion(index) {
  setQuestions((previous) =>
    previous.filter((_, i) => i !== index)
  );
}


  
async function handleSubmit(event) {
  event.preventDefault();

  setError("");

  if (formData.title.trim().length < 3) {
    setError("Interview title must contain at least 3 characters.");
    return;
  }

  if (
    formData.scheduledAt &&
    new Date(formData.scheduledAt).getTime() < Date.now()
  ) {
    setError("Please select a future interview date and time.");
    return;
  }

  const payload = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    instructions: formData.instructions.trim(),
    format: formData.format,
    scheduledAt: formData.scheduledAt
      ? new Date(formData.scheduledAt).toISOString()
      : null,
    durationMinutes: Number(formData.durationMinutes),
    maxParticipants: formData.maxParticipants
      ? Number(formData.maxParticipants)
      : null,
    warningLimit: Number(formData.warningLimit),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preventCopyPasteEnabled: formData.preventCopyPasteEnabled,
    tabSwitchDetectionEnabled: formData.tabSwitchDetectionEnabled,
    fullscreenRequired: formData.fullscreenRequired,
    faceDetectionEnabled: formData.faceDetectionEnabled,
    multipleFaceDetectionEnabled:
      formData.multipleFaceDetectionEnabled,
    suspiciousGestureDetectionEnabled:
      formData.suspiciousGestureDetectionEnabled,
    cameraDisconnectDetectionEnabled:
      formData.cameraDisconnectDetectionEnabled,
  };

  try {
    setLoading(true);

    // Step 1: Create the interview
    const response = await interviewService.createInterview(payload);

    const createdInterview = response?.data?.interview;
    const interviewId = createdInterview?._id || createdInterview?.id;

    if (!interviewId) {
      throw new Error("Interview created, but its ID was not returned.");
    }

    // Step 2: Save questions if the host added any
    if (questions.length > 0) {
      await interviewService.setQuestions(interviewId, questions);
    }

    // Step 3: Navigate after successful creation and question saving
    navigate("/interviews", {
      state: {
        message: response?.message || "Interview created successfully!",
        createdInterview,
      },
    });

  } catch (err) {
    console.error("Create interview error:", err);
    setError(err.message || "Failed to create interview.");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="create-interview-page">
      <div className="create-interview-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/interviews")}
        >
          ← Back to Dashboard
        </button>

        <span className="welcome-tag">HOST WORKSPACE</span>

        <h1>Create New Interview</h1>

        <p>
          Configure your interview, choose the format and
          set up security preferences.
        </p>
      </div>

      <form
        className="create-interview-form"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* BASIC INFORMATION */}

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-section-number">01</span>

            <div>
              <h2>Basic Information</h2>
              <p>Give your interview a title and description.</p>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="title">
              Interview Title <span>*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Frontend Developer Interview"
              value={formData.title}
              onChange={handleChange}
              minLength={3}
              maxLength={150}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe the purpose of this interview..."
              value={formData.description}
              onChange={handleChange}
              maxLength={5000}
              rows={3}
            />
          </div>

          <div className="form-field">
            <label htmlFor="instructions">
              Candidate Instructions
            </label>

            <textarea
              id="instructions"
              name="instructions"
              placeholder="Write instructions candidates should follow..."
              value={formData.instructions}
              onChange={handleChange}
              maxLength={10000}
              rows={4}
            />
          </div>
        </section>

        {/* INTERVIEW CONFIGURATION */}

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-section-number">02</span>

            <div>
              <h2>Interview Configuration</h2>
              <p>Choose how your interview will take place.</p>
            </div>
          </div>

          <div className="form-field">
            <label>Interview Format</label>

            <div className="format-options">
              <label
                className={`format-option ${
                  formData.format === "LIVE" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="LIVE"
                  checked={formData.format === "LIVE"}
                  onChange={handleChange}
                />

                <div>
                  <strong>Live Interview</strong>
                  <p>Real-time interview with video and audio.</p>
                </div>
              </label>

              <label
                className={`format-option ${
                  formData.format === "ASYNC" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="ASYNC"
                  checked={formData.format === "ASYNC"}
                  onChange={handleChange}
                />

                <div>
                  <strong>Async Interview</strong>
                  <p>Candidates complete questions independently.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="scheduledAt">
                Scheduled Date & Time
              </label>

              <input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt || ""}
                onChange={handleChange}
              />

              <small>
                Leave empty if the interview can start immediately.
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="durationMinutes">
                Duration (minutes) <span>*</span>
              </label>

              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                max="525600"
                value={formData.durationMinutes}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="maxParticipants">
                Maximum Participants
              </label>

              <input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="1"
                max="1000"
                placeholder="Unlimited"
                value={formData.maxParticipants}
                onChange={handleChange}
              />

              <small>Leave empty for no participant limit.</small>
            </div>
          </div>
        </section>

        {/* SECURITY SETTINGS */}

<section className="form-section">
  <div className="form-section-heading">
    <span className="form-section-number">03</span>

    <div>
      <h2>Security & Proctoring</h2>
      <p>
        Configure browser monitoring and candidate security preferences.
      </p>
    </div>
  </div>

  <ProctoringSettings
    settings={formData}
    onChange={handleProctoringSettingChange}
  />
</section>

        {/* QUESTION MANAGEMENT */}

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-section-number">05</span>

            <div>
              <h2>Interview Questions</h2>
              <p>Add MCQ questions for your candidates.</p>
            </div>
          </div>

          <button
            type="button"
            className="add-question-btn"
            onClick={() => setShowQuestionForm(!showQuestionForm)}
          >
            {showQuestionForm ? "Close Question Form" : "+ Add Questions"}
          </button>

          {showQuestionForm && (
            <div className="form-field">

              <label>Question</label>

              <textarea
                value={newQuestion.prompt}
                onChange={(e) =>
                  handleQuestionChange("prompt", e.target.value)
                }
                placeholder="Enter your question"
                maxLength={2000}
              />

              <label>Answer Options</label>

              {newQuestion.options.map((option, index) => (
                <div key={index}>
                  <input
                    type="radio"
                    name="createCorrectOption"
                    checked={newQuestion.correctOption === index}
                    onChange={() =>
                      handleQuestionChange("correctOption", index)
                    }
                  />

                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(index, e.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    maxLength={500}
                  />

                  {newQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addOption}
                disabled={newQuestion.options.length >= 6}
              >
                + Add Option
              </button>

              <p>Select the radio button beside the correct answer.</p>

              <label>Marks</label>

              <input
                type="number"
                min="1"
                max="1000"
                value={newQuestion.marks}
                onChange={(e) =>
                  handleQuestionChange("marks", e.target.value)
                }
              />

              <button type="button" onClick={addQuestion}>
                Add Question to List
              </button>

            </div>
          )}

          <div className="created-questions-list">
            <h3>Added Questions ({questions.length}/100)</h3>

            {questions.map((question, index) => (
              <div className="question-card" key={index}>
                <h4>Question {index + 1}</h4>

                <p>{question.prompt}</p>

                <ol type="A">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex}>
                      {option}
                      {optionIndex === question.correctOption && " ✓ Correct"}
                    </li>
                  ))}
                </ol>

                <p>Marks: {question.marks}</p>

                <button
                  type="button"
                  onClick={() => deleteQuestion(index)}
                >
                  Delete Question
                </button>
              </div>
            ))}
          </div>
        </section>


        {/* ACTIONS */}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/interviews")}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Interview →"}
          </button>
        </div>
      </form>

    </div>
  );
}

export default CreateInterview;
