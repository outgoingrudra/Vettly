
import apiRequest from "../../../services/api.js";

export async function signupUser({ name, email, password }) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
}

export async function loginUser({ email, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function verifyEmail(token) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export async function resendVerificationEmail(email) {
  return apiRequest("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}

export async function requestPasswordReset(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword({ token, password }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}
