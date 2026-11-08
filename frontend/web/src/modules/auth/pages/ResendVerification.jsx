
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout";
import { resendVerificationEmail } from "../services/authService";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    try {
      await resendVerificationEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || "Unable to process your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Resend verification email"
      subtitle="Enter the email address you used to create your account."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {sent && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            If verification is needed for this account, an email will be sent.
          </p>
        )}

        <div>
          <label htmlFor="resend-email" className="mb-2 block text-sm font-medium">
            Email address
          </label>
          <input
            id="resend-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Resend verification email"}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
