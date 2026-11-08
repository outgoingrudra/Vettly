
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { requestPasswordReset } from "../services/authService.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
  event.preventDefault();

  setLoading(true);
  setError("");
  setSubmitted(false);
  setSuccessMessage("");

  try {
    const response = await requestPasswordReset(email.trim());

    setSuccessMessage(
      response?.message ||
        "If an account exists for this email, password-reset instructions will be sent to it. Check your inbox."
    );

    setSubmitted(true);
  } catch (err) {
    setError(
      err.message || "Unable to process your request. Please try again."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you instructions to reset your password."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl dark:bg-indigo-400/10">
            🔐
          </div>
        </div>

        {submitted ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            If an account exists for this email, password-reset instructions
            will be sent to it. Check your inbox.
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending instructions..." : "Send reset link"}
            </button>
          </>
        )}

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
