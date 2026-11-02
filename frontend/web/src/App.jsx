import { Link } from "react-router-dom";
import ThemeToggle from "./components/ui/ThemeToggle.jsx";

const features = [
  {
    number: "01",
    title: "Custom interviews",
    description:
      "Build interviews around your own questions, skills, and evaluation criteria.",
    icon: "✦",
  },
  {
    number: "02",
    title: "Smarter assessments",
    description:
      "Evaluate candidate performance with structured assessments and clear insights.",
    icon: "◎",
  },
  {
    number: "03",
    title: "One interview workspace",
    description:
      "Organize participants, manage sessions, and keep every interview in one place.",
    icon: "▦",
  },
];

const skills = ["Problem solving", "Communication", "Technical skills"];

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9ff] text-slate-900 transition-colors dark:bg-[#080b16] dark:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#080b16]/80">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-600/20">
              V
            </span>
            <span className="text-2xl font-bold tracking-tight">Vettly</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              Sign in
            </Link>

            <ThemeToggle />

            <Link
              to="/signup"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-400/10 blur-[120px] dark:bg-indigo-600/15" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-2">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              A smarter way to interview
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Make every
              <span className="block text-indigo-600 dark:text-indigo-400">
                interview
              </span>
              <span className="block">count.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              Create meaningful interviews, assess real skills, and discover
              great talent. Everything you need to make better hiring decisions
              — all in one workspace.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white shadow-xl shadow-indigo-600/20 transition hover:-translate-y-1 hover:bg-indigo-700"
              >
                Create your free account
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>

              <Link
                to="/login"
                className="rounded-xl border border-slate-300 bg-white/70 px-6 py-4 font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              >
                I have an account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Customizable assessments
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Organized interview sessions
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-sky-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-950/10 dark:border-white/10 dark:bg-[#111625]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                    V
                  </div>
                  <div>
                    <p className="text-sm font-bold">Interview overview</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your workspace
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  ● Live preview
                </span>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Welcome back
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    Your interviews, simplified.
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["12", "Interviews"],
                    ["08", "Candidates"],
                    ["04", "Upcoming"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4"
                    >
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">
                        Full Stack Developer
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Technical interview
                      </p>
                    </div>
                    <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
                      In progress
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {skills.map((skill, index) => (
                      <div key={skill}>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            {skill}
                          </span>
                          <span className="font-semibold">
                            {[92, 78, 85][index]}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${[92, 78, 85][index]}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-400/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
                    ✦
                  </div>
                  <div>
                    <p className="text-sm font-bold">Assessment insights</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Turn interview results into clear insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#171c2c] sm:block">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidate evaluation
              </p>
              <p className="mt-1 text-lg font-bold">
                <span className="text-emerald-500">↗</span> Clear insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Built for better interviews
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need.
              <span className="block text-slate-500 dark:text-slate-400">
                Nothing you don't.
              </span>
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
              A simple, organized way to create assessments and manage the
              interview process.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-950/5 dark:border-white/10 dark:bg-[#111625] dark:hover:border-indigo-400/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-400/10 dark:text-indigo-300">
                    {feature.icon}
                  </span>
                  <span className="text-sm font-semibold text-slate-300 dark:text-slate-600">
                    {feature.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Signup call to action */}
      <section className="px-5 py-20 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-indigo-600 px-7 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[50px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full border-[50px] border-white/10" />

          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
              Your next interview starts here
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to interview smarter?
            </h2>
            <p className="mt-5 leading-7 text-indigo-100">
              Create your Vettly account and bring your interview process into
              one organized workspace.
            </p>

            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-7 py-4 font-bold text-indigo-700 shadow-xl transition hover:-translate-y-1 hover:bg-indigo-50"
            >
              Get started with Vettly <span>→</span>
            </Link>

            <p className="mt-5 text-sm text-indigo-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-white underline underline-offset-4 hover:text-indigo-100"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:px-8">
          <Link to="/" className="font-bold text-slate-800 dark:text-white">
            Vettly
          </Link>
          <p>Make every interview count.</p>
          <p>© {new Date().getFullYear()} Vettly</p>
        </div>
      </footer>
    </main>
  );
}