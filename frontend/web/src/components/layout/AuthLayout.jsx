
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  ShieldCheck,
  Video,
  ClipboardCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import ThemeToggle from "../ui/ThemeToggle.jsx";

const features = [
  {
    icon: BrainCircuit,
    title: "Smart assessments",
    description: "Create customized interview assessments.",
  },
  {
    icon: Video,
    title: "Live interviews",
    description: "Connect candidates and recruiters in real time.",
  },
  {
    icon: ClipboardCheck,
    title: "Better evaluation",
    description: "Manage submissions and candidate reviews.",
  },
];

export default function AuthLayout({
  children,
  title = "Welcome to Vettly",
  subtitle = "Your next interview starts here.",
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
      </div>

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">

        {/* Branding panel */}
        <aside className="flex flex-col justify-between px-6 pb-6 pt-7 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12 xl:px-20">

          {/* Logo */}
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
            aria-label="Vettly home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <BrainCircuit size={25} />
            </span>

            <span className="text-2xl font-bold tracking-tight">
              Vettly
              <span className="text-indigo-600 dark:text-indigo-400">.</span>
            </span>
          </Link>

          {/* Main branding content */}
          <div className="my-9 max-w-xl lg:my-auto lg:py-16">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Sparkles size={15} />
              AI-powered interview platform
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              Make every
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                interview count.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
              Create smarter assessments, connect with candidates, and
              manage interviews with a platform built for better hiring.
            </p>

            {/* Feature cards */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-400/10 dark:text-indigo-300">
                      <Icon size={20} />
                    </span>

                    <div>
                      <p className="text-sm font-semibold">
                        {feature.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security information */}
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheck
                size={17}
                className="text-emerald-600 dark:text-emerald-400"
              />
              Secure account access
            </div>
          </div>

          {/* Desktop footer */}
          <p className="hidden text-sm text-slate-500 dark:text-slate-500 lg:block">
            © {new Date().getFullYear()} Vettly. Built for better interviews.
          </p>
        </aside>

        {/* Authentication panel */}
        <section className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8 lg:w-1/2 lg:px-10 lg:py-16">

          <div className="w-full max-w-md">

            {/* Mobile branding */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                <Sparkles size={16} />
                Welcome to Vettly
              </div>

              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck size={14} />
                Secure access
              </span>
            </div>

            {/* Form card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">

              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              </div>

              {children}
            </div>

            {/* Legal links */}
            <p className="mt-6 text-center text-xs leading-6 text-slate-500 dark:text-slate-500">
              By continuing, you agree to Vettly's{" "}
              <Link
                to="/terms"
                className="font-medium underline underline-offset-4 transition hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="font-medium underline underline-offset-4 transition hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Privacy Policy
              </Link>
              .
            </p>

            {/* Mobile footer */}
            <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-600 lg:hidden">
              © {new Date().getFullYear()} Vettly
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
