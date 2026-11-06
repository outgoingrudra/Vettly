import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

import App from "../App.jsx";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
} from "react-router-dom";

import { AuthProvider } from "../context/AuthContext.jsx";

import Login from "../modules/auth/pages/Login.jsx";
import Signup from "../modules/auth/pages/Signup.jsx";
import VerifyEmail from "../modules/auth/pages/VerifyEmail.jsx";
import ForgotPassword from "../modules/auth/pages/ForgotPassword.jsx";
import ResetPassword from "../modules/auth/pages/ResetPassword.jsx";
import ResendVerification from "../modules/auth/pages/ResendVerification.jsx";
import Profile from "../modules/auth/pages/Profile.jsx";
import Sessions from "../modules/auth/pages/Sessions.jsx";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import Logout from "../modules/auth/pages/Logout.jsx";

function Dashboard() {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const name =
    user?.name ??
    user?.fullName ??
    user?.full_name ??
    "User";

  const email = user?.email ?? "Not provided";

  const userId =
    user?.id ??
    user?.userId ??
    user?.user_id ??
    "Not provided";

  const role =
    user?.role?.roleName ??
    user?.role?.role_name ??
    user?.role ??
    "User";

  const initial = name.charAt(0).toUpperCase();
  const menuItems = [
    { name: "Overview", path: "/dashboard", icon: "▦" },
    { name: "My Profile", path: "/profile", icon: "👤" },
    { name: "Sessions", path: "/sessions", icon: "💻" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:block">
        <Link to="/dashboard" className="text-2xl font-extrabold text-indigo-600">
          Vettly<span className="text-slate-900 dark:text-white">.</span>
        </Link>

        <p className="mt-2 text-xs text-slate-500">
          Interview & Assessment Platform
        </p>

        <div className="mt-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Link
            to="/logout"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <span>↪</span>
            Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64">

        {/* Top Navbar */}

        {/* Top Navbar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 md:px-10">
          <div>
            <h2 className="text-lg font-bold">Dashboard</h2>
            <p className="text-xs text-slate-500">
              Manage your Vettly account
            </p>
          </div>

          {/* Profile Avatar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfile((prev) => !prev)}
              aria-expanded={showProfile}
              aria-label="Open profile menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              {initial}
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">

                <div className="bg-indigo-600 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold text-indigo-600">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{name}</h3>
                      <p className="truncate text-xs text-indigo-100">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Full Name</p>
                    <p className="mt-1 font-medium">{name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Email Address</p>
                    <p className="mt-1 break-all font-medium">{email}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">User ID</p>
                    <p className="mt-1 break-all font-medium">{userId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Account Role</p>
                    <p className="mt-1 font-medium">{role}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfile(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                  >
                    View Full Profile →
                  </Link>

                  <Link
                    to="/logout"
                    onClick={() => setShowProfile(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Logout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>


        <div className="p-6 md:p-10">

          {/* Welcome Section */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-8 text-white shadow-lg md:p-10">
            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-medium text-indigo-100">
                Welcome to Vettly 👋
              </p>

              <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
                Your professional journey starts here.
              </h1>

              <p className="mt-4 text-sm leading-6 text-indigo-100 md:text-base">
                Manage your account, update your profile, and keep track
                of your account security from one place.
              </p>

              <Link
                to="/profile"
                className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
              >
                Complete your profile →
              </Link>
            </div>

            <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
            <div className="absolute -bottom-24 right-32 h-64 w-64 rounded-full border-[35px] border-white/10" />
          </section>

          {/* Overview Cards */}
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-xl font-bold">Account Overview</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Quick access to your account settings.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              <Link
                to="/profile"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl dark:bg-indigo-500/10">
                  👤
                </div>
                <h3 className="mt-5 font-bold">My Profile</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  View and update your personal information.
                </p>
                <p className="mt-5 text-sm font-semibold text-indigo-600 group-hover:underline dark:text-indigo-400">
                  View Profile →
                </p>
              </Link>

              <Link
                to="/sessions"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl dark:bg-emerald-500/10">
                  💻
                </div>
                <h3 className="mt-5 font-bold">Active Sessions</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Review and manage your logged-in devices.
                </p>
                <p className="mt-5 text-sm font-semibold text-indigo-600 group-hover:underline dark:text-indigo-400">
                  Manage Sessions →
                </p>
              </Link>

              <Link
                to="/forgot-password"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl dark:bg-amber-500/10">
                  🔐
                </div>
                <h3 className="mt-5 font-bold">Account Security</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Access password recovery and protect your account.
                </p>
                <p className="mt-5 text-sm font-semibold text-indigo-600 group-hover:underline dark:text-indigo-400">
                  Security Settings →
                </p>
              </Link>

            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold">Quick Actions</h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/profile"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Edit Profile
              </Link>

              <Link
                to="/sessions"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Manage Devices
              </Link>

              <Link
                to="/logout"
                className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
              >
                Logout
              </Link>
            </div>
          </section>

          <footer className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Vettly. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/resend-verification"
            element={<ResendVerification />}
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/me" element={<Navigate to="/profile" replace />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/logout" element={<Logout />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
