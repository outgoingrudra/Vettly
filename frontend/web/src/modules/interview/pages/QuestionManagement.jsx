
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import interviewService from "../services/interviewService";

function QuestionManagement() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newQuestion, setNewQuestion] = useState({
    prompt: "",
    options: ["", ""],
    correctOption: 0,
    marks: 1,
  });

  useEffect(() => {
    loadInterview();
  }, [id]);

  async function loadInterview() {
    try {
      setLoading(true);
      const response = await interviewService.getInterview(id);
      const data = response?.data?.interview ?? response?.data;

      setInterview(data);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || "Unable to load interview.");
    } finally {
      setLoading(false);
    }
  }

  function updateNewQuestion(field, value) {
    setNewQuestion((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateOption(index, value) {
    setNewQuestion((previous) => {
      const options = [...previous.options];
      options[index] = value;

      return { ...previous, options };
    });
  }

  function addOption() {
    if (newQuestion.options.length >= 6) return;

    updateNewQuestion("options", [...newQuestion.options, ""]);
  }

  function removeOption(index) {
    if (newQuestion.options.length <= 2) return;

    setNewQuestion((previous) => {
      const options = previous.options.filter((_, i) => i !== index);
      let correctOption = previous.correctOption;

      if (correctOption === index) {
        correctOption = 0;
      } else if (correctOption > index) {
        correctOption--;
      }

      return { ...previous, options, correctOption };
    });
  }

  function addQuestion() {
    setError("");

    const prompt = newQuestion.prompt.trim();
    const options = newQuestion.options.map((option) => option.trim());

    if (!prompt) {
      setError("Please enter the question.");
      return;
    }

    if (options.some((option) => !option)) {
      setError("Please fill in all options.");
      return;
    }

    if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
      setError("Duplicate options are not allowed.");
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
        correctOption: Number(newQuestion.correctOption),
        marks: Number(newQuestion.marks),
      },
    ]);

    setNewQuestion({
      prompt: "",
      options: ["", ""],
      correctOption: 0,
      marks: 1,
    });
  }

  function deleteQuestion(index) {
    setQuestions((previous) => previous.filter((_, i) => i !== index));
  }

  async function saveQuestions() {
    setError("");

    if (!interview || interview.status !== "DRAFT") {
      setError("Questions can only be changed for draft interviews.");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question before saving.");
      return;
    }

    try {
      setSaving(true);

      const payload = questions.map((question) => ({
        prompt: question.prompt.trim(),
        options: question.options.map((option) => option.trim()),
        correctOption: Number(question.correctOption),
        marks: Number(question.marks),
      }));

      await interviewService.setQuestions(id, payload);

      navigate(`/interviews/${id}`);
    } catch (err) {
      setError(err.message || "Unable to save questions.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading questions...</p>;

  if (error && !interview) {
    return <p>{error}</p>;
  }

  if (!interview) return <p>Interview not found.</p>;

  if (interview.status !== "DRAFT") {
    return (
      <div className="interview-content">
        <h2>Question Management</h2>
        <p>Questions can only be managed while the interview is in Draft status.</p>
        <button onClick={() => navigate(`/interviews/${id}`)}>
          Back to Interview
        </button>
      </div>
    );
  }

  return (
    <div className="interview-content question-management-page">
      <h2>Question Management</h2>
      <p>Manage questions for: {interview.title}</p>

      {error && <p className="error-message">{error}</p>}

      <div className="content-panel">
        <h3>Add New Question</h3>

        <label>Question</label>
        <textarea
          value={newQuestion.prompt}
          onChange={(e) => updateNewQuestion("prompt", e.target.value)}
          placeholder="Enter your question"
          maxLength={2000}
        />

        <h4>Options</h4>

        {newQuestion.options.map((option, index) => (
          <div key={index}>
            <input
              type="radio"
              name="correctOption"
              checked={newQuestion.correctOption === index}
              onChange={() => updateNewQuestion("correctOption", index)}
            />

            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              maxLength={500}
            />

            {newQuestion.options.length > 2 && (
              <button type="button" onClick={() => removeOption(index)}>
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
          onChange={(e) => updateNewQuestion("marks", e.target.value)}
        />

        <button type="button" onClick={addQuestion}>
          Add Question
        </button>
      </div>

      <div className="content-panel">
        <h3>Added Questions ({questions.length}/100)</h3>

        {questions.length === 0 ? (
          <p>No questions added yet.</p>
        ) : (
          questions.map((question, index) => (
            <div className="question-card" key={question.id || index}>
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
          ))
        )}
      </div>

      <div className="form-actions">
        <button onClick={() => navigate(`/interviews/${id}`)}>
          Cancel
        </button>

        <button onClick={saveQuestions} disabled={saving}>
          {saving ? "Saving..." : "Save Questions"}
        </button>
      </div>
    </div>
  );
}

export default QuestionManagement;
