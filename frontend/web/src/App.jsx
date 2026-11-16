
import { Link } from "react-router-dom";
import ThemeToggle from "./components/ui/ThemeToggle.jsx";

const features = [
  {
    number: "01",
    title: "Custom interviews",
    description:
      "Design tailored interview experiences with your own questions, skills, and evaluation criteria.",
    icon: "✦",
    color: "indigo",
  },
  {
    number: "02",
    title: "Structured assessments",
    description:
      "Evaluate technical knowledge, problem-solving, and communication through organized assessments.",
    icon: "◎",
    color: "violet",
  },
  {
    number: "03",
    title: "Live video interviews",
    description:
      "Connect with candidates through live interviews with integrated video and real-time chat.",
    icon: "◉",
    color: "blue",
  },
  {
    number: "04",
    title: "Centralized workspace",
    description:
      "Manage candidates, interview sessions, assessments, and results from one organized workspace.",
    icon: "▦",
    color: "emerald",
  },
];

const skills = [
  { name: "Problem solving", score: 92 },
  { name: "Communication", score: 78 },
  { name: "Technical skills", score: 85 },
];

const stats = [
  { value: "12", label: "Interviews", icon: "▤" },
  { value: "08", label: "Candidates", icon: "♙" },
  { value: "04", label: "Upcoming", icon: "◷" },
];

const steps = [
  {
    number: "01",
    title: "Create an interview",
    description:
      "Set up your interview with custom questions, skills, and assessment preferences.",
  },
  {
    number: "02",
    title: "Invite candidates",
    description:
      "Organize participants and give candidates access to their interview sessions.",
  },
  {
    number: "03",
    title: "Evaluate performance",
    description:
      "Review assessment responses and use structured insights to make decisions.",
  },
];

function Logo() {
  return (
    <Link
      to="/"
      aria-label="Vettly home"
      className="group flex shrink-0 items-center gap-2.5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 text-xl font-black text-white shadow-lg shadow-indigo-600/25 transition duration-300 group-hover:rotate-6 group-hover:scale-105">
        V
      </span>
      <span className="text-2xl font-extrabold tracking-tight">
        Vettly<span className="text-indigo-600 dark:text-indigo-400">.</span>
      </span>
    </Link>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
      {children}
    </span>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-sky-500/20 blur-3xl" />

      <div className="absolute -right-8 top-16 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl shadow-indigo-950/10 dark:border-white/10 dark:bg-[#111827] dark:shadow-black/30">
        {/* Dashboard header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 font-bold text-white">
              V
            </div>

            <div>
              <p className="text-sm font-bold">Vettly workspace</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interview dashboard
              </p>
            </div>
          </div>

          <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Workspace preview
          </span>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your interview workspace
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Manage interviews smarter.
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Everything organized in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-indigo-200 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-400/30 sm:p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg text-indigo-600 dark:text-indigo-400">
                    {stat.icon}
                  </span>
                  <span className="text-xl font-extrabold tracking-tight sm:text-2xl">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Interview card */}
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  CURRENT INTERVIEW
                </p>
                <h3 className="mt-1 font-bold">Full Stack Developer</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Technical assessment
                </p>
              </div>

              <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
                In progress
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {skill.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {skill.score}%
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
                    role="progressbar"
                    aria-label={skill.name}
                    aria-valuenow={skill.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom insight */}
          <div className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 dark:border-indigo-400/10 dark:from-indigo-500/10 dark:to-violet-500/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-600/20">
              ✦
            </div>
            <div>
              <p className="text-sm font-bold">Assessment insights</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                Keep candidate performance and evaluation organized.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card */}
      <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#171e30] sm:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            ✓
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interview workflow
            </p>
            <p className="text-sm font-bold">One organized space</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fafaff] text-slate-900 transition-colors duration-300 dark:bg-[#080b16] dark:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#080b16]/85">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
          aria-label="Main navigation"
        >
          <Logo />

          <div className="hidden items-center gap-8 lg:flex">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              About
            </a>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <ThemeToggle />

            <Link
              to="/login"
              className="hidden text-sm font-bold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 sm:block"
            >
              Sign in
            </Link>

            <Link
              to="/signup"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-[#080b16] sm:px-5"
            >
              Get started <span className="ml-1">→</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="about" className="relative scroll-mt-24">
        <div className="pointer-events-none absolute -left-48 top-20 h-[450px] w-[450px] rounded-full bg-indigo-400/10 blur-[120px] dark:bg-indigo-600/15" />
        <div className="pointer-events-none absolute -right-48 top-40 h-[450px] w-[450px] rounded-full bg-violet-400/10 blur-[120px] dark:bg-violet-600/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-[fadeInUp_0.7s_ease-out_both]">
            <SectionLabel>
              A smarter way to interview
            </SectionLabel>

            <h1 className="mt-8 max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[4.5rem]">
              Make every
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-sky-400">
                interview
              </span>
              count.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
              Create meaningful interviews, assess real skills, and discover
              great talent. Bring your interview process, candidates, and
              evaluations together in one intelligent workspace.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-7 py-4 font-bold text-white shadow-xl shadow-indigo-600/20 transition duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-[#080b16]"
              >
                Create your free account
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-7 py-4 font-bold transition duration-300 hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-indigo-400/40 dark:hover:bg-white/[0.08]"
              >
                Sign in to Vettly
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="font-bold text-emerald-500">✓</span>
                Custom assessments
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-emerald-500">✓</span>
                Live interviews
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-emerald-500">✓</span>
                Organized evaluations
              </span>
            </div>
          </div>

          <div className="animate-[fadeInUp_0.9s_ease-out_both]">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Feature introduction */}
      <section className="border-y border-slate-200/70 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:grid-cols-3 sm:px-8">
          {[
            ["01", "Create", "Build tailored interview experiences."],
            ["02", "Connect", "Bring candidates into one workspace."],
            ["03", "Evaluate", "Review performance systematically."],
          ].map(([number, title, description]) => (
            <div key={number} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-extrabold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                {number}
              </span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Powerful features</SectionLabel>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Everything you need.
              <span className="mt-2 block text-slate-400 dark:text-slate-500">
                All in one workspace.
              </span>
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-400">
              A streamlined platform designed to make creating, conducting,
              and evaluating interviews easier.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-950/[0.06] dark:border-white/[0.08] dark:bg-[#111625] dark:hover:border-indigo-400/40 dark:hover:shadow-indigo-950/20"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/[0.04] transition-transform duration-500 group-hover:scale-150 dark:bg-indigo-400/[0.06]" />

                <div className="relative flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 transition duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-600/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                    {feature.icon}
                  </span>

                  <span className="text-sm font-extrabold tracking-wider text-slate-300 dark:text-slate-600">
                    {feature.number}
                  </span>
                </div>

                <h3 className="relative mt-7 text-lg font-bold tracking-tight">
                  {feature.title}
                </h3>

                <p className="relative mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>

                <div className="mt-7 h-1 w-10 rounded-full bg-indigo-500 transition-all duration-300 group-hover:w-20" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-slate-200/70 bg-white/60 px-5 py-24 dark:border-white/[0.07] dark:bg-white/[0.015] sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Simple workflow</SectionLabel>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
              From interview setup
              <span className="block text-indigo-600 dark:text-indigo-400">
                to evaluation.
              </span>
            </h2>

            <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
              Keep your interview workflow clear and organized at every step.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-extrabold text-white shadow-lg shadow-indigo-600/20">
                    {step.number}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-300 to-transparent dark:from-indigo-400/30" />
                </div>

                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-24 sm:px-8 lg:py-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-7 py-16 text-center text-white shadow-2xl shadow-indigo-950/20 sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full border-[60px] border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-48 -left-20 h-96 w-96 rounded-full border-[60px] border-white/[0.07]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-400/20 blur-[100px]" />

          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-100">
              ✦ Your next interview starts here
            </span>

            <h2 className="mt-7 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Ready to make every interview count?
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-indigo-100">
              Bring your interview process into one organized workspace.
              Create your Vettly account and get started.
            </p>

            <Link
              to="/signup"
              className="group mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 font-extrabold text-indigo-700 shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-indigo-50"
            >
              Get started with Vettly
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <p className="mt-6 text-sm text-indigo-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-9 sm:flex-row sm:px-8">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Logo />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Make every interview count.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <a href="#features" className="transition hover:text-indigo-500">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-indigo-500">
              How it works
            </a>
            <Link to="/login" className="transition hover:text-indigo-500">
              Sign in
            </Link>
            <Link to="/signup" className="transition hover:text-indigo-500">
              Sign up
            </Link>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Vettly. All rights reserved.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
