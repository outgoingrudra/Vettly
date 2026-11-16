
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  const name =
    user?.name ??
    user?.fullName ??
    user?.full_name ??
    "User";

  const firstName = String(name).trim().split(/\s+/)[0] || "User";

  return (
    <div className="mx-auto max-w-7xl">

      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-7 text-white shadow-xl md:p-10">

        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold text-indigo-100">
            Welcome to Vettly 👋
          </p>

          <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
            Hello, {firstName}!
            <br />
            Your professional journey starts here.
          </h2>

          <p className="mt-4 text-sm leading-7 text-indigo-100 md:text-base">
            Manage your interviews, organize assessments, update your
            profile, and track your progress from one place.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/interviews"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              Explore Interviews →
            </Link>

            <Link
              to="/profile"
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Complete Your Profile
            </Link>
          </div>
        </div>

        {/* Decorative Shapes */}
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
        <div className="absolute -bottom-24 right-32 h-64 w-64 rounded-full border-[35px] border-white/10" />
        <div className="absolute right-10 top-10 h-20 w-20 rounded-full bg-white/5 blur-xl" />
      </section>

      {/* Account Overview */}
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Account Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quick access to your Vettly workspace.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {/* Profile Card */}
          <Link
            to="/profile"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl dark:bg-indigo-500/10">
              👤
            </div>

            <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
              My Profile
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              View and update your personal information.
            </p>

            <p className="mt-5 text-sm font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
              View Profile →
            </p>
          </Link>

          {/* Interview Card */}
          <Link
            to="/interviews"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-2xl dark:bg-violet-500/10">
              🎯
            </div>

            <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
              Interviews
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Explore and manage your interviews and assessments.
            </p>

            <p className="mt-5 text-sm font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
              View Interviews →
            </p>
          </Link>

          {/* Sessions Card */}
          <Link
            to="/sessions"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl dark:bg-emerald-500/10">
              💻
            </div>

            <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
              Active Sessions
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Review and manage your logged-in devices.
            </p>

            <p className="mt-5 text-sm font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
              Manage Sessions →
            </p>
          </Link>

          {/* Security Card */}
          <Link
            to="/forgot-password"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl dark:bg-amber-500/10">
              🔐
            </div>

            <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
              Account Security
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Access password recovery and protect your account.
            </p>

            <p className="mt-5 text-sm font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
              Security Settings →
            </p>
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Get started with your Vettly workspace.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/interviews/create"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Create Interview
          </Link>

          <Link
            to="/interviews"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Browse Interviews
          </Link>

          <Link
            to="/profile"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Edit Profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} Vettly. All rights reserved.
      </footer>

    </div>
  );
}
