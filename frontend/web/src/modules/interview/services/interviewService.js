
import apiRequest from "../../../services/api.js";

// Change this only if your backend mounts the interview router
// at a different URL.
const INTERVIEW_API = "/interviews";

// Helper to build query strings.
function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

const interviewService = {
  // =========================
  // HOST: INTERVIEW MANAGEMENT
  // =========================

  // Get interviews created by the logged-in host.
  listInterviews(params = {}) {
    return apiRequest(
      `${INTERVIEW_API}${buildQuery(params)}`
    );
  },

  // Get one interview's full details.
  getInterview(id) {
    return apiRequest(`${INTERVIEW_API}/${id}`);
  },

  // Create a new interview.
  createInterview(payload) {
    return apiRequest(INTERVIEW_API, {
      method: "POST",
      body: payload,
    });
  },

  // Update a draft interview.
  updateInterview(id, payload) {
    return apiRequest(`${INTERVIEW_API}/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  // Publish a draft interview.
  publishInterview(id) {
    return apiRequest(`${INTERVIEW_API}/${id}/publish`, {
      method: "PATCH",
    });
  },

  // Archive an interview.
  archiveInterview(id) {
    return apiRequest(`${INTERVIEW_API}/${id}/archive`, {
      method: "PATCH",
    });
  },

  // Delete a draft interview.
  deleteInterview(id) {
    return apiRequest(`${INTERVIEW_API}/${id}`, {
      method: "DELETE",
    });
  },

  // Add or replace interview questions.
  setQuestions(id, questions) {
    return apiRequest(`${INTERVIEW_API}/${id}/questions`, {
      method: "PUT",
      body: { questions },
    });
  },

  // =========================
  // HOST: PARTICIPANTS
  // =========================

  // Invite a candidate by email.
  inviteParticipant(id, email) {
    return apiRequest(`${INTERVIEW_API}/${id}/participants`, {
      method: "POST",
      body: { email },
    });
  },

  // Get invited and participating candidates.
  listParticipants(id, params = {}) {
    return apiRequest(
      `${INTERVIEW_API}/${id}/participants${buildQuery(params)}`
    );
  },

  // =========================
  // HOST: PROCTORING
  // =========================

  // Get proctoring events for an interview.
  listProctoringEvents(id, params = {}) {
    return apiRequest(
      `${INTERVIEW_API}/${id}/proctoring-events${buildQuery(params)}`
    );
  },

  // Review a proctoring event.
  reviewProctoringEvent(id, eventId, payload) {
    return apiRequest(
      `${INTERVIEW_API}/${id}/proctoring-events/${eventId}`,
      {
        method: "PATCH",
        body: payload,
      }
    );
  },

  // Retry Stream participant synchronization.
  retryStreamSync(id, participantId) {
    return apiRequest(
      `${INTERVIEW_API}/${id}/participants/${participantId}/retry-stream-sync`,
      {
        method: "POST",
      }
    );
  },

  // =========================
  // CANDIDATE: JOIN INTERVIEW
  // =========================

  // Preview an interview before joining.
  previewInterview(id) {
    return apiRequest(`${INTERVIEW_API}/${id}/join`);
  },

  // Join an interview using its ID.
  joinInterview(id) {
    return apiRequest(`${INTERVIEW_API}/${id}/join`, {
      method: "POST",
    });
  },

  // Accept an invitation using its token.
  acceptInvitation(token) {
    return apiRequest(`${INTERVIEW_API}/accept-invitation`, {
      method: "POST",
      body: { token },
    });
  },

  // Start an interview through an accepted invitation.
  startParticipant(participantId) {
    return apiRequest(
      `${INTERVIEW_API}/participants/${participantId}/start`,
      {
        method: "POST",
      }
    );
  },

  // =========================
  // CANDIDATE: ATTEMPTS
  // =========================

  // Get the logged-in candidate's attempts.
  getMyAttempts(params = {}) {
    return apiRequest(
      `${INTERVIEW_API}/attempts/mine${buildQuery(params)}`
    );
  },

  // Submit answers for an attempt.
  submitAttempt(attemptId, answers) {
    return apiRequest(
      `${INTERVIEW_API}/attempts/${attemptId}/submit`,
      {
        method: "POST",
        body: { answers },
      }
    );
  },

  // Send a proctoring event.
  createProctoringEvent(attemptId, event) {
    return apiRequest(
      `${INTERVIEW_API}/attempts/${attemptId}/proctoring-events`,
      {
        method: "POST",
        body: event,
      }
    );
  },

  // =========================
  // RESULTS
  // =========================

  // Get the candidate's result history.
  getMyResults(params = {}) {
    return apiRequest(
      `${INTERVIEW_API}/results/mine${buildQuery(params)}`
    );
  },

  // Get a particular attempt's result.
  getResult(attemptId) {
    return apiRequest(
      `${INTERVIEW_API}/attempts/${attemptId}/result`
    );
  },

  // Host publishes a result.
  publishResult(attemptId, feedback) {
    return apiRequest(
      `${INTERVIEW_API}/attempts/${attemptId}/publish-result`,
      {
        method: "POST",
        body: { feedback },
      }
    );
  },

  // Host resends the result email.
  resendResult(attemptId) {
    return apiRequest(
      `${INTERVIEW_API}/attempts/${attemptId}/resend-result`,
      {
        method: "POST",
      }
    );
  },
};

export default interviewService;
