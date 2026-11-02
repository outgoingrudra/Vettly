
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await signupUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess(
        "Your account has been created. Check your email for the verification link."
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
              "Account created. Please verify your email and sign in.",
          },
        });
      }, 1800);
    } catch (err) {
      setError(
        err.message || "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with smarter interviews using Vettly."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {success}
          </div>
        )}

        <div>
          <label htmlFor="signup-name" className="mb-2 block text-sm font-medium">
            Full name
          </label>
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
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm font-medium">
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            minLength={8}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="mb-2 block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            minLength={8}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
            className="mt-1 accent-indigo-600"
          />
          Show passwords
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
