
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import interviewService from "../services/interviewService.js";

const initialFormData = {
  title: "",
  description: "",
  instructions: "",
  format: "LIVE",
  scheduledAt: "",
  durationMinutes: 30,
  maxParticipants: "",
  preventCopyPasteEnabled: false,
  tabSwitchDetectionEnabled: false,
  fullscreenRequired: false,
  faceDetectionEnabled: false,
  multipleFaceDetectionEnabled: false,
  suspiciousGestureDetectionEnabled: false,
  cameraDisconnectDetectionEnabled: false,
  warningLimit: 3,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

// Convert an ISO date into the format required by datetime-local.
function toLocalDateTime(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const offset = parsedDate.getTimezoneOffset() * 60000;

  return new Date(parsedDate.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function EditInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await interviewService.getInterview(id);

      const interview =
        response?.data?.interview ?? response?.data;

      if (!interview) {
        throw new Error("Interview details could not be loaded.");
      }

      // Only draft interviews can be edited.
      if (interview.status !== "DRAFT") {
        setError("Only draft interviews can be edited.");
        return;
      }

      setFormData({
        title: interview.title || "",
        description: interview.description || "",
        instructions: interview.instructions || "",
        format: interview.format || "LIVE",
        scheduledAt: toLocalDateTime(interview.scheduledAt),
        durationMinutes: interview.durationMinutes ?? 30,
        maxParticipants: interview.maxParticipants ?? "",
        preventCopyPasteEnabled:
          interview.preventCopyPasteEnabled ?? false,
        tabSwitchDetectionEnabled:
          interview.tabSwitchDetectionEnabled ?? false,
        fullscreenRequired: interview.fullscreenRequired ?? false,
        faceDetectionEnabled: interview.faceDetectionEnabled ?? false,
        multipleFaceDetectionEnabled:
          interview.multipleFaceDetectionEnabled ?? false,
        suspiciousGestureDetectionEnabled:
          interview.suspiciousGestureDetectionEnabled ?? false,
        cameraDisconnectDetectionEnabled:
          interview.cameraDisconnectDetectionEnabled ?? false,
        warningLimit: interview.warningLimit ?? 3,
        timezone:
          interview.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "UTC",
      });
    } catch (err) {
      setError(err.message || "Failed to load interview.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.title.trim().length < 3) {
      setError("Interview title must contain at least 3 characters.");
      return;
    }

    if (Number(formData.durationMinutes) < 1) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    if (
      formData.scheduledAt &&
      new Date(formData.scheduledAt).getTime() < Date.now()
    ) {
      setError("Scheduled date and time cannot be in the past.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description,
      instructions: formData.instructions,
      format: formData.format,
      scheduledAt: formData.scheduledAt
        ? new Date(formData.scheduledAt).toISOString()
        : null,
      durationMinutes: Number(formData.durationMinutes),
      maxParticipants:
        formData.maxParticipants === ""
          ? null
          : Number(formData.maxParticipants),
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
      warningLimit: Number(formData.warningLimit),
      timezone: formData.timezone,
    };

    try {
      setSaving(true);

      await interviewService.updateInterview(id, payload);

      setSuccess("Interview updated successfully!");

      // Return to the interview details page after saving.
      setTimeout(() => {
        navigate(`/interviews/${id}`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update interview.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="interview-content">
        <p>Loading interview details...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="interview-content">
        <p>{error}</p>
        <button type="button" onClick={() => navigate(`/interviews/${id}`)}>
          Back to Interview
        </button>
      </div>
    );
  }

  return (
    <div className="interview-content edit-interview-page">
    <div className="content-panel">
        <button
          type="button"
          onClick={() => navigate(`/interviews/${id}`)}
        >
          Back to Interview
        </button>

        <h2>Edit Interview</h2>
        <p>Update your interview details and settings.</p>

        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        {success && <p style={{ color: "#22c55e" }}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title">Interview Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              minLength={3}
              maxLength={150}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={5000}
              rows={4}
            />
          </div>

          <div className="form-field">
            <label htmlFor="instructions">Candidate Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              maxLength={10000}
              rows={4}
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="format">Interview Format</label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleChange}
              >
                <option value="LIVE">Live Interview</option>
                <option value="ASYNC">Asynchronous Interview</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="durationMinutes">
                Duration (Minutes)
              </label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={handleChange}
                required
              />
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
                value={formData.scheduledAt}
                onChange={handleChange}
              />
              <small>
                Leave empty if the interview can start immediately.
              </small>
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
                value={formData.maxParticipants}
                onChange={handleChange}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="timezone">Timezone</label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              value={formData.timezone}
              onChange={handleChange}
              required
            />
          </div>

          <h3>Security & Proctoring Settings</h3>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="preventCopyPasteEnabled"
                checked={formData.preventCopyPasteEnabled}
                onChange={handleChange}
              />
              Prevent Copy, Cut and Paste
            </label>
          </div>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="tabSwitchDetectionEnabled"
                checked={formData.tabSwitchDetectionEnabled}
                onChange={handleChange}
              />
              Detect Tab Switching
            </label>
          </div>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="fullscreenRequired"
                checked={formData.fullscreenRequired}
                onChange={handleChange}
              />
              Require Fullscreen Mode
            </label>
          </div>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="faceDetectionEnabled"
                checked={formData.faceDetectionEnabled}
                onChange={handleChange}
              />
              Enable Face Detection
            </label>
          </div>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="multipleFaceDetectionEnabled"
                checked={formData.multipleFaceDetectionEnabled}
                onChange={handleChange}
              />
              Detect Multiple Faces
            </label>
          </div>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="suspiciousGestureDetectionEnabled"
                checked={formData.suspiciousGestureDetectionEnabled}
                onChange={handleChange}
              />
              Detect Suspicious Gestures
            </label>
          </div>

          <div className="form-field">
            <label>
              <input
                type="checkbox"
                name="cameraDisconnectDetectionEnabled"
                checked={formData.cameraDisconnectDetectionEnabled}
                onChange={handleChange}
              />
              Detect Camera Disconnection
            </label>
          </div>

          <div className="form-field">
            <label htmlFor="warningLimit">Warning Limit</label>
            <input
              id="warningLimit"
              name="warningLimit"
              type="number"
              min="1"
              max="1000"
              value={formData.warningLimit}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/interviews/${id}`)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditInterview;
