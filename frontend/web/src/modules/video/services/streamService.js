import apiRequest from "../../../services/api.js";

const STREAM_API = "/stream";

const streamService = {
  setup: (interviewId) =>
    apiRequest(`${STREAM_API}/${interviewId}/setup`, {
      method: "POST",
    }),

  getToken: (interviewId) =>
    apiRequest(`${STREAM_API}/${interviewId}/token`, {
      method: "POST",
    }),

  end: (interviewId) =>
    apiRequest(`${STREAM_API}/${interviewId}/end`, {
      method: "POST",
    }),
};

export default streamService;