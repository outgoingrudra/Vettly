
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import interviewService from "../services/interviewService.js";
import ProctoringMonitor from "../../proctoring/components/ProctoringMonitor.jsx";

const LANGUAGES = [
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

function getQuestionType(question) {
  const kind = String(question.kind || "MCQ").toUpperCase();

  if (["WRITTEN", "TEXT", "SUBJECTIVE"].includes(kind)) {
    return "WRITTEN";
  }

  if (["CODING", "CODE", "PROGRAMMING"].includes(kind)) {
    return "CODING";
  }

  return "MCQ";
}

function InterviewAttempt() {

  const EMPTY_QUESTIONS = [];

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialAttempt = location.state?.attempt ?? null;

  const initialQuestions =
    location.state?.questions ?? EMPTY_QUESTIONS;

  const [attempt, setAttempt] = useState(initialAttempt);
  const [questions, setQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [proctoringSettings, setProctoringSettings] = useState({});
  const [proctoringWarning, setProctoringWarning] = useState("");
  const [proctoringTerminated, setProctoringTerminated] = useState(false);


  const [fullscreenActive, setFullscreenActive] = useState(false);
  const fullscreenRequired = Boolean(
    proctoringSettings.fullscreenRequired
  );

  const fullscreenBlocked =
    fullscreenRequired && !fullscreenActive;

  const isAssessmentLocked =
    submitting ||
    proctoringTerminated ||
    fullscreenBlocked;

  // Load interview monitoring settings and active attempt.
  useEffect(() => {
    let cancelled = false;

    async function loadAttempt() {
      try {
        setLoading(true);
        setError("");

        // Fetch configured proctoring settings.
        const previewResponse =
          await interviewService.previewInterview(id);

        const previewData =
          previewResponse?.data ?? previewResponse;

        const interviewSettings =
          previewData?.interview ?? previewData;

        if (!cancelled) {
          setProctoringSettings(interviewSettings || {});
        }

        // Reuse the attempt passed through router state.
        if (initialAttempt && initialQuestions.length > 0) {
          if (!cancelled) {
            setAttempt(initialAttempt);
            setQuestions(initialQuestions);
          }

          return;
        }

        // Otherwise, join the interview.
        const response = await interviewService.joinInterview(id);
        const data = response?.data ?? response;

        if (!data?.attempt?.id) {
          throw new Error("Attempt information not found.");
        }

        if (!cancelled) {
          setAttempt(data.attempt);
          setQuestions(
            Array.isArray(data.questions) ? data.questions : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load interview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadAttempt();
    } else {
      setError("Interview ID is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id, initialAttempt, initialQuestions]);

  // Handle proctoring warnings.
  const handleProctoringWarning = useCallback(
    (response) => {
      const count = response?.warningCount ?? 0;

      const limit =
        response?.warningLimit ??
        proctoringSettings.warningLimit ??
        3;

      setProctoringWarning(
        `Security warning ${count} of ${limit}. This event has been recorded for review.`
      );
    },
    [proctoringSettings.warningLimit]
  );

  const handleProctoringTermination = useCallback(
    (response) => {
      setProctoringTerminated(true);

      const count = response?.warningCount;

      const limit =
        response?.warningLimit ??
        proctoringSettings.warningLimit ??
        3;

      setProctoringWarning(
        count
          ? `Your assessment was terminated after reaching ${count} of ${limit} security warnings.`
          : "Your assessment has been terminated because the configured security warning limit was reached."
      );
    },
    [proctoringSettings.warningLimit]
  );

  const handleFullscreenStatusChange = useCallback(
    (active) => {
      setFullscreenActive(active);
    },
    []
  );

  // Update answers.
  function handleAnswer(questionId, value) {
    if (isAssessmentLocked) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  }

  // Check whether a question has been answered.
  function isAnswered(question) {
    const answer = answers[question.id];
    const type = getQuestionType(question);

    if (!answer) return false;

    if (type === "MCQ") {
      return Number.isInteger(answer.selectedOption);
    }

    if (type === "WRITTEN") {
      return Boolean(answer.text?.trim());
    }

    return Boolean(answer.code?.trim());
  }

  const answeredCount = useMemo(
    () => questions.filter(isAnswered).length,
    [questions, answers]
  );

  const totalQuestions = questions.length;

  const progress =
    totalQuestions > 0
      ? (answeredCount / totalQuestions) * 100
      : 0;

  // Submit assessment.
  async function handleSubmit() {
    if (fullscreenRequired && !fullscreenActive) {
      setError("Please enter fullscreen before submitting.");
      return;
    }

    if (proctoringTerminated) {
      setError("This assessment has already been terminated.");
      return;
    }

    if (!attempt?.id) {
      setError("Interview attempt not found.");
      return;
    }

    if (totalQuestions === 0) {
      setError("No questions available.");
      return;
    }

    const unanswered = questions.filter(
      (question) => !isAnswered(question)
    );

    if (unanswered.length > 0) {
      setError(
        `Please answer all questions. ${unanswered.length} remaining.`
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to submit your interview?"
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formattedAnswers = questions.map((question) => {
        const answer = answers[question.id];
        const type = getQuestionType(question);

        if (type === "MCQ") {
          return {
            questionId: question.id,
            selectedOption: answer.selectedOption,
          };
        }

        if (type === "WRITTEN") {
          return {
            questionId: question.id,
            text: answer.text,
          };
        }

        return {
          questionId: question.id,
          code: answer.code,
          language: answer.language,
        };
      });

      await interviewService.submitAttempt(
        attempt.id,
        formattedAnswers
      );

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit interview.");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading screen.
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />

        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          Loading your interview questions...
        </p>
      </div>
    );
  }

  // Loading error.
  if (error && !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600 dark:bg-red-500/10 dark:text-red-400">
            !
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            Unable to load interview
          </h2>

          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            onClick={() => navigate("/interviews")}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  // Terminated assessment screen.
  if (proctoringTerminated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-9 text-center shadow-xl dark:border-red-500/30 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
            !
          </div>

          <p className="mt-6 text-xs font-bold tracking-widest text-red-600 dark:text-red-400">
            SECURITY LIMIT REACHED
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            Assessment Terminated
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {proctoringWarning ||
              "Your assessment was terminated after reaching the configured security warning limit."}
          </p>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Please contact the interviewer for assistance.
          </p>

          <button
            onClick={() => navigate("/interviews")}
            className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  // Submission success screen.
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            ✓
          </div>

          <p className="mt-6 text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
            SUBMISSION COMPLETE
          </p>

          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            Interview Submitted!
          </h2>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Your answers have been submitted successfully.
          </p>

          <div className="mt-8 rounded-2xl bg-slate-100 p-6 dark:bg-slate-800">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {answeredCount}/{totalQuestions}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Questions answered
            </p>
          </div>

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Your result will be available after the host publishes it.
          </p>

          <button
            onClick={() => navigate("/interviews")}
            className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors sm:px-6 sm:py-8 lg:px-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              CANDIDATE PORTAL
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Interview Assessment
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Read every question carefully before answering.
            </p>
          </div>

          <span className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            IN PROGRESS
          </span>
        </div>

        {/* PROCTORING MONITOR */}
        <ProctoringMonitor
          attemptId={attempt?.id}
          settings={proctoringSettings}
          initialWarningCount={attempt?.warningCount ?? 0}
          onWarning={handleProctoringWarning}
          onTerminated={handleProctoringTermination}
          onFullscreenStatusChange={handleFullscreenStatusChange}
        />
        {/* PROCTORING WARNING */}
        {proctoringWarning && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <p className="font-semibold">Security notification</p>
            <p className="mt-1">{proctoringWarning}</p>
          </div>
        )}


        {fullscreenBlocked && !proctoringTerminated && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <p className="font-semibold">
              Fullscreen mode required
            </p>

            <p className="mt-1">
              Your interviewer requires fullscreen mode.
              Please enter fullscreen using the button above
              before continuing your assessment.
            </p>
          </div>
        )}

        {/* PROGRESS */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">
                YOUR PROGRESS
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track your assessment completion.
              </p>
            </div>

            <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3 text-center sm:gap-5">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalQuestions}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Total Questions
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {answeredCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Answered
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {totalQuestions - answeredCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Remaining
              </p>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
          <span className="text-lg">ℹ</span>

          <div>
            <p className="font-semibold">Assessment Instructions</p>
            <p className="mt-1 leading-6 opacity-90">
              Complete all questions before submitting your assessment.
              Configured browser monitoring may record security-related
              events for interviewer review. Please note that reaching
              the configured warning limit can terminate your attempt.
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* QUESTIONS */}
        <fieldset
          disabled={isAssessmentLocked}
          className="mt-7 space-y-6 disabled:cursor-not-allowed"
        >
          {questions.map((question, index) => {
            const type = getQuestionType(question);
            const answer = answers[question.id];

            return (
              <section
                key={question.id || index}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors sm:p-8 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                    QUESTION {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {question.marks ?? 1} Marks
                  </span>
                </div>

                <div className="mt-5">
                  <span className="inline-flex rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {type === "MCQ"
                      ? "Multiple Choice"
                      : type === "WRITTEN"
                        ? "Written Question"
                        : "Coding Question"}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-semibold leading-relaxed text-slate-900 sm:text-xl dark:text-white">
                  {question.prompt}
                </h2>

                {/* MCQ */}
                {type === "MCQ" && (
                  <div className="mt-6 space-y-3">
                    {(question.options || []).map((option, optionIndex) => {
                      const selected =
                        answer?.selectedOption === optionIndex;

                      return (
                        <label
                          key={optionIndex}
                          className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${selected
                              ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-500"
                            }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={selected}
                            onChange={() =>
                              handleAnswer(question.id, {
                                selectedOption: optionIndex,
                              })
                            }
                            className="h-4 w-4 accent-indigo-600"
                          />

                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${selected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                              }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </span>

                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                            {option}
                          </span>

                          {selected && (
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              ✓
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* WRITTEN */}
                {type === "WRITTEN" && (
                  <div className="mt-6">
                    <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Your Answer
                    </label>

                    <textarea
                      value={answer?.text || ""}
                      onChange={(event) =>
                        handleAnswer(question.id, {
                          text: event.target.value,
                        })
                      }
                      rows={7}
                      placeholder="Write your answer here..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
                    />

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {answer?.text?.trim()
                        ? answer.text.trim().split(/\s+/).length
                        : 0}{" "}
                      words entered
                      {question.maxWords
                        ? ` · Maximum ${question.maxWords} words`
                        : ""}
                    </p>
                  </div>
                )}

                {/* CODING */}
                {type === "CODING" && (
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Programming Language
                      </label>

                      <select
                        value={answer?.language || "java"}
                        onChange={(event) =>
                          handleAnswer(question.id, {
                            code: answer?.code || "",
                            language: event.target.value,
                          })
                        }
                        className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        {LANGUAGES.map((language) => (
                          <option
                            key={language.value}
                            value={language.value}
                          >
                            {language.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Your Code
                      </label>

                      <textarea
                        value={answer?.code || ""}
                        onChange={(event) =>
                          handleAnswer(question.id, {
                            code: event.target.value,
                            language: answer?.language || "java",
                          })
                        }
                        rows={15}
                        spellCheck={false}
                        placeholder="// Write your solution here..."
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-100 p-5 font-mono text-sm leading-6 text-emerald-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-[#080d19] dark:text-emerald-300"
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review your code before submitting.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </fieldset>

        {/* SUBMIT SECTION */}
        <div className="mt-8 flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ready to submit?
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {answeredCount === totalQuestions
                ? "All questions have been answered."
                : `${totalQuestions - answeredCount} question(s) remaining.`}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              isAssessmentLocked ||
              totalQuestions === 0 ||
              !attempt
            }
            className="rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Interview →"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs leading-6 text-slate-500 dark:text-slate-500">
          Your assessment progress is maintained while this page remains open.
          Please submit your answers before leaving the assessment.
        </p>
      </div>
    </div>
  );
}

export default InterviewAttempt;
