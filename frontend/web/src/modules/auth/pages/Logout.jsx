
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function Logout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      await logout();
      navigate("/login", {
        replace: true,
        state: { message: "You have successfully signed out." },
      });
    } catch (err) {
      setError(err.message || "Unable to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign out of Vettly?"
      subtitle="Are you sure you want to end your current session?"
    >
      <div className="space-y-6">
        {user?.email && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Signed in as
            </p>
            <p className="mt-1 break-all font-medium">
              {user.name || user.fullName || user.full_name || user.email}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="w-full rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing out..." : "Yes, sign me out"}
        </button>

        <Link
          to="/dashboard"
          className="block text-center font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Cancel and return to dashboard
        </Link>
      </div>
    </AuthLayout>
  );
}
