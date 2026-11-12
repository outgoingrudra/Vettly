import api from '../../../services/api.js';

export const hostInterviewService = {
  // 1. Interviews CRUD & Lifecycle
  listMyInterviews: () => api.get('/interviews'),
  getInterviewById: (id) => api.get(`/interviews/${id}`),
  createInterview: (payload) => api.post('/interviews', payload),
  updateInterview: (id, payload) => api.patch(`/interviews/${id}`, payload),
  setQuestions: (id, questions) => api.put(`/interviews/${id}/questions`, { questions }),
  publishInterview: (id) => api.patch(`/interviews/${id}/publish`),
  archiveInterview: (id) => api.patch(`/interviews/${id}/archive`),
  deleteInterview: (id) => api.delete(`/interviews/${id}`),

  // 2. Participants
  inviteParticipant: (interviewId, email) => 
    api.post(`/interviews/${interviewId}/participants`, { email }),
  listParticipants: (interviewId) => 
    api.get(`/interviews/${interviewId}/participants`),
  retryStreamSync: (interviewId, participantId) => 
    api.post(`/interviews/${interviewId}/participants/${participantId}/retry-stream-sync`),

  // 3. Proctoring & Results
  listProctoringEvents: (interviewId) => 
    api.get(`/interviews/${interviewId}/proctoring-events`),
  reviewProctoringEvent: (interviewId, eventId, status) => 
    api.patch(`/interviews/${interviewId}/proctoring-events/${eventId}`, { status }),
  publishResult: (attemptId) => 
    api.post(`/interviews/attempts/${attemptId}/publish-result`),
  resendResult: (attemptId) => 
    api.post(`/interviews/attempts/${attemptId}/resend-result`)
};