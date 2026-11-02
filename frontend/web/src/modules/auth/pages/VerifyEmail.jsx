
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { verifyEmail } from "../services/authService.js";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleVerify() {
    setError("");
    setStatus("loading");

    try {
      await verifyEmail(token);
      setStatus("success");
    } catch (err) {
      setError(
        err.message || "Verification failed. Your link may have expired.",
      );
      setStatus("error");
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Confirm your email address to finish setting up your Vettly account."
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl dark:bg-indigo-400/10">
            ✉️
          </div>
        </div>

        {!token ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            The verification token is missing. Please open the complete link
            from your verification email.
          </p>
        ) : status === "success" ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            Your email has been verified successfully. You can now sign in.
          </div>
        ) : (
          <>
            <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-400">
              Click below to verify your email address. If your link has
              expired, request a new verification email.
            </p>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={status === "loading"}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Verifying..." : "Verify email"}
            </button>
          </>
        )}

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already verified?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>

        {status === "error" && (
          <p className="text-center text-sm">
            <Link
              to="/resend-verification"
              className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Request a new verification link
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
