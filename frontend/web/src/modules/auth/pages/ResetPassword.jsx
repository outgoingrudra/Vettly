
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { resetPassword } from "../services/authService.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = useMemo(
    () => [
      {
        label: "At least 8 characters",
        valid: password.length >= 8,
      },
      {
        label: "One uppercase letter",
        valid: /[A-Z]/.test(password),
      },
      {
        label: "One lowercase letter",
        valid: /[a-z]/.test(password),
      },
      {
        label: "One number",
        valid: /\d/.test(password),
      },
    ],
    [password]
  );

  const passwordStrength = passwordChecks.filter(
    (check) => check.valid
  ).length;

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError(
        "Your reset link is missing its token. Please request a new link."
      );
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password.length > 128) {
      setError("Your password cannot exceed 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword({ token, password });

      navigate("/login", {
        replace: true,
        state: {
          message: "Password reset successfully. Please sign in.",
        },
      });
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to reset your password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create a new password"
      subtitle="Choose a strong password to secure your Vettly account."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Missing token */}
        {!token && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <p className="font-semibold">Invalid reset link</p>
            <p className="mt-1">
              Your reset link is incomplete or missing its token.
            </p>

            <Link
              to="/forgot-password"
              className="mt-3 inline-flex font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Request another link
            </Link>
          </div>
        )}

        {/* New password */}
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            New password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your new password"
              minLength={8}
              maxLength={128}
              required
              disabled={loading || !token}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      passwordStrength >= level
                        ? passwordStrength <= 1
                          ? "bg-red-500"
                          : passwordStrength <= 2
                            ? "bg-amber-500"
                            : passwordStrength === 3
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {passwordChecks.map((check) => (
                  <div
                    key={check.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    {check.valid ? (
                      <CheckCircle2
                        size={14}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <XCircle
                        size={14}
                        className="shrink-0 text-slate-400"
                      />
                    )}

                    <span
                      className={
                        check.valid
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Confirm new password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              minLength={8}
              maxLength={128}
              required
              disabled={loading || !token}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((value) => !value)
              }
              disabled={loading}
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {showConfirmPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                passwordsMatch
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500"
              }`}
            >
              {passwordsMatch ? (
                <CheckCircle2 size={14} />
              ) : (
                <XCircle size={14} />
              )}

              {passwordsMatch
                ? "Passwords match"
                : "Passwords do not match"}
            </p>
          )}
        </div>

        {/* Security information */}
        <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/30">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400"
          />

          <p className="text-xs leading-relaxed text-indigo-800 dark:text-indigo-300">
            Use a unique password that you do not use on other websites.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            loading ||
            !token ||
            password.length < 8 ||
            password.length > 128 ||
            password !== confirmPassword
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              <LockKeyhole size={18} />
              Reset password
            </>
          )}
        </button>

        {/* Back to login */}
        <p className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
