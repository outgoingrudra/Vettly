
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function Profile() {
  const { user, logout, authLoading } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const name = user.name ?? user.fullName ?? user.full_name ?? "User";
  const email = user.email ?? "Not provided";
  const userId = user.id ?? user.userId ?? user.user_id ?? "Not provided";

  return (
    <AuthLayout
      title="Your profile"
      subtitle="Manage your Vettly account."
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold">{name}</h3>
            <p className="break-all text-sm text-slate-500 dark:text-slate-400">
              {email}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Full name
            </p>
            <p className="mt-1 font-medium">{name}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Email address
            </p>
            <p className="mt-1 break-all font-medium">{email}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Account ID
            </p>
            <p className="mt-1 break-all text-sm font-medium">{userId}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/sessions"
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-700"
          >
            Manage sessions
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
