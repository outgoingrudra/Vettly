
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Menu,
  UserRound,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic page title
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") return "Dashboard";
    if (path === "/profile") return "My Profile";
    if (path === "/sessions") return "Account Sessions";
    if (path === "/interviews") return "Interviews";
    if (path === "/interviews/create") return "Create Interview";

    if (path.endsWith("/edit")) return "Edit Interview";
    if (path.endsWith("/questions")) return "Question Management";
    if (path.endsWith("/join")) return "Join Interview";
    if (path.endsWith("/attempt")) return "Assessment Attempt";
    if (path.endsWith("/video")) return "Live Video Interview";

    if (/^\/interviews\/[^/]+$/.test(path)) {
      return "Interview Details";
    }

    return "Vettly Workspace";
  };

  const pageTitle = getPageTitle();

  // User information
  const displayName =
    user?.name ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setProfileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 lg:px-8">

      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {pageTitle}
          </h2>

          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            Manage your Vettly workspace
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen((previous) => !previous)}
          className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-expanded={profileOpen}
          aria-label="Open profile menu"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {initials || "U"}
          </div>

          <div className="hidden text-left sm:block">
            <p className="max-w-36 truncate text-sm font-semibold text-slate-800 dark:text-white">
              {displayName}
            </p>

            <p className="max-w-36 truncate text-xs text-slate-500 dark:text-slate-400">
              {user?.email || "Account"}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`hidden text-slate-500 transition sm:block ${
              profileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Profile Dropdown */}
        {profileOpen && (
          <>
            <button
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setProfileOpen(false)}
              aria-label="Close profile menu"
            />

            <div className="absolute right-0 top-14 z-50 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">

              <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {displayName}
                </p>

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || "No email available"}
                </p>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <UserRound size={17} />
                My Profile
              </Link>

              <Link
                to="/sessions"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings size={17} />
                Account Sessions
              </Link>

              <button
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
