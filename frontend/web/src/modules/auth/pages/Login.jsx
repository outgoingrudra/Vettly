
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext.jsx";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const destination = location.state?.from;
  const successMessage = location.state?.message;

  // Clear navigation message after displaying it.
  useEffect(() => {
    if (successMessage) {
      navigate(location.pathname, {
        replace: true,
        state: {
          from: destination,
        },
      });
    }
  }, [successMessage, navigate, location.pathname, destination]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
  }

  function getErrorMessage(err) {
    return (
      err?.data?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Unable to sign in. Please check your credentials and try again."
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const email = form.email.trim();

    if (!email || !form.password) {
      setError("Please enter your email address and password.");
      return;
    }

    try {
      setLoading(true);

      await login({
        email,
        password: form.password,
      });

      const target =
        typeof destination === "string"
          ? destination
          : destination?.pathname
            ? `${destination.pathname}${destination.search || ""}${destination.hash || ""}`
            : "/dashboard";

      navigate(
        target.startsWith("/") && !target.startsWith("//")
          ? target
          : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      console.error("LOGIN FAILED:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your Vettly account."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        aria-busy={loading}
      >
        {/* Password reset success message */}
        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <span className="mt-0.5 font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
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
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              maxLength={254}
              required
              disabled={loading}
              aria-invalid={Boolean(error)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <LockKeyhole
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              maxLength={128}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((current) => !current)
              }
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in to Vettly"
          )}
        </button>

        {/* Signup */}
        <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Create an account
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          By continuing, you agree to use Vettly responsibly.
        </p>
      </form>
    </AuthLayout>
  );
}
