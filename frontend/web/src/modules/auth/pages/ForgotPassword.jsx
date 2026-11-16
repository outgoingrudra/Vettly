
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { requestPasswordReset } from "../services/authService.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset(normalizedEmail);

      setSubmitted(true);
    } catch (err) {
      console.error("PASSWORD RESET REQUEST FAILED:", err);

      setError(
        err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (loading || !submitted) return;

    try {
      setLoading(true);
      setError("");

      await requestPasswordReset(email.trim());
    } catch (err) {
      console.error("PASSWORD RESET RESEND FAILED:", err);

      setError(
        "Unable to resend the instructions right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={submitted ? "Check your inbox" : "Forgot your password?"}
      subtitle={
        submitted
          ? "We've processed your password reset request."
          : "No worries. Enter your email and we'll help you reset your password."
      }
    >
      <div className="space-y-6">

        {/* Illustration */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 ring-8 ring-indigo-50 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/5">
            {submitted ? (
              <CheckCircle2 size={32} />
            ) : (
              <LockKeyhole size={32} />
            )}
          </div>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="space-y-5">

            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />

                <div>
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Request processed
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-400">
                    If an account exists for this email address, password
                    reset instructions will be sent to it.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                Didn't receive the email?
              </p>

              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Check your spam or junk folder.</li>
                <li>Verify that you entered the correct email.</li>
                <li>Wait a few minutes before requesting again.</li>
              </ul>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw size={17} />
                  Resend instructions
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError("");
              }}
              disabled={loading}
              className="w-full text-sm font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
            >
              Try a different email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Sending instructions...
                </>
              ) : (
                <>
                  Send reset instructions
                  <ArrowLeft size={17} className="rotate-180" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div className="border-t border-slate-200 pt-5 text-center dark:border-slate-800">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
