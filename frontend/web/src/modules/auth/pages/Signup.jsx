
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { signupUser } from "../services/authService.js";

export default function Signup() {
  const navigate = useNavigate();
  const navigationTimer = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (navigationTimer.current !== null) {
        window.clearTimeout(navigationTimer.current);
      }
    };
  }, []);

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: form.password.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(form.password),
    },
    {
      label: "At least one lowercase letter",
      valid: /[a-z]/.test(form.password),
    },
    {
      label: "At least one number",
      valid: /\d/.test(form.password),
    },
  ];

  const passwordStrength = passwordChecks.filter(
    (check) => check.valid
  ).length;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  }

  function getErrorMessage(err) {
    return (
      err?.data?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Unable to create your account. Please try again."
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (name.length > 100) {
      setError("Your name cannot exceed 100 characters.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password.length > 128) {
      setError("Your password cannot exceed 128 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await signupUser({
        name,
        email,
        password: form.password,
      });

      setSuccess(
        "Your account has been created successfully. Please check your email for the verification link."
      );

      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      navigationTimer.current = window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Account created successfully. Please verify your email before signing in.",
          },
        });
      }, 2500);
    } catch (err) {
      console.error("SIGNUP FAILED:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with smarter interviews using Vettly."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-busy={loading}
      >
        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Full name */}
        <div>
          <label htmlFor="signup-name" className={labelClass}>
            Full name
          </label>

          <div className="relative">
            <UserRound
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              maxLength={100}
              required
              disabled={loading || Boolean(success)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className={labelClass}>
            Email address
          </label>

          <div className="relative">
            <Mail
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              maxLength={254}
              required
              disabled={loading || Boolean(success)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password" className={labelClass}>
            Password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              minLength={8}
              maxLength={128}
              required
              disabled={loading || Boolean(success)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {/* Password strength */}
          {form.password && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      passwordStrength >= level
                        ? passwordStrength <= 2
                          ? "bg-amber-500"
                          : passwordStrength === 3
                            ? "bg-indigo-500"
                            : "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {passwordChecks.map((check) => (
                  <p
                    key={check.label}
                    className={`flex items-center gap-1.5 text-xs ${
                      check.valid
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {check.label}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className={labelClass}
          >
            Confirm password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              minLength={8}
              maxLength={128}
              required
              disabled={loading || Boolean(success)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
              disabled={loading}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              aria-pressed={showConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            >
              {showConfirmPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {form.confirmPassword && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                form.password === form.confirmPassword
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {form.password === form.confirmPassword ? (
                <>
                  <CheckCircle2 size={14} />
                  Passwords match
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Passwords do not match
                </>
              )}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || Boolean(success)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Creating account...
            </>
          ) : success ? (
            <>
              <CheckCircle2 size={19} />
              Account created
            </>
          ) : (
            "Create your Vettly account"
          )}
        </button>

        {/* Login link */}
        <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Your account will need email verification before signing in.
        </p>
      </form>
    </AuthLayout>
  );
}
