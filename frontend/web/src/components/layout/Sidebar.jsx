
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  UserRound,
  Video,
  CalendarDays,
  X,
  BrainCircuit,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "My Profile",
    path: "/profile",
    icon: UserRound,
  },
  {
    name: "Interviews",
    path: "/interviews",
    icon: Video,
  },
  {
    name: "Sessions",
    path: "/sessions",
    icon: CalendarDays,
  },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300
          dark:border-slate-800 dark:bg-slate-950
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BrainCircuit size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Vettly
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interview Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end ?? false}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 rounded-xl px-4 py-3
                    text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-indigo-400"
                    }
                  `
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <div className="mb-4 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Need help?
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              Manage your assessments and account from one place.
            </p>
          </div>

          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Vettly
          </p>
        </div>
      </aside>
    </>
  );
}
