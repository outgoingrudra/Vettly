
const availableOptions = [
  {
    key: "preventCopyPasteEnabled",
    title: "Copy, cut and paste monitoring",
    description:
      "Block clipboard actions and record detected attempts during the assessment.",
  },
  {
    key: "tabSwitchDetectionEnabled",
    title: "Tab and page-visibility detection",
    description:
      "Record when the candidate switches tabs or the assessment page becomes hidden.",
  },
  {
    key: "fullscreenRequired",
    title: "Require fullscreen",
    description:
      "Ask candidates to enter fullscreen and record when they exit it.",
  },
  {
    key: "cameraDisconnectDetectionEnabled",
    title: "Camera availability monitoring",
    description:
      "Monitor camera availability after the candidate grants permission.",
  },
];

const unavailableOptions = [
  {
    title: "Face-presence detection",
    description: "Requires a supported face-detection model.",
  },
  {
    title: "Multiple-face detection",
    description: "Requires a supported face-detection model.",
  },
  {
    title: "Gaze-related signals",
    description: "Requires a supported gaze-detection technology.",
  },
  {
    title: "Suspicious gesture detection",
    description: "Requires a validated gesture-detection model.",
  },
];

function ProctoringSettings({ settings = {}, onChange }) {
  const updateSetting = (key, value) => {
    onChange?.(key, value);
  };

  const warningLimit = settings.warningLimit ?? 3;

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
      <div>
        <h2 className="text-lg font-semibold">
          Assessment integrity settings
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose which supported browser and device signals should
          be monitored during this assessment.
        </p>
      </div>

      <div className="space-y-3">
        {availableOptions.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500"
          >
            <input
              type="checkbox"
              checked={Boolean(settings[option.key])}
              onChange={(event) =>
                updateSetting(option.key, event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                {option.title}
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Additional detection capabilities
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          These capabilities are not currently available. They
          will remain disabled until their detection technology
          and event handling are implemented and tested.
        </p>

        <div className="mt-3 space-y-2">
          {unavailableOptions.map((option) => (
            <div
              key={option.title}
              className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800"
            >
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {option.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {option.description}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Unavailable
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <label
          htmlFor="proctoring-warning-limit"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Warning limit
        </label>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Configure the warning threshold used by your backend.
          Verify its enforcement behavior before relying on it
          to terminate an assessment.
        </p>

        <input
          id="proctoring-warning-limit"
          type="number"
          min="1"
          max="1000"
          step="1"
          value={warningLimit}
          onChange={(event) => {
            const value = Number(event.target.value);

            if (
              Number.isInteger(value) &&
              value >= 1 &&
              value <= 1000
            ) {
              updateSetting("warningLimit", value);
            }
          }}
          className="mt-3 w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-500/20"
        />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Important monitoring notice
        </h3>

        <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
          Browser-based monitoring cannot guarantee that cheating
          is impossible. Signals may be inaccurate or have
          legitimate explanations. They should be treated as
          evidence for interviewer review, not automatic proof
          of misconduct.
        </p>
      </div>
    </section>
  );
}

export default ProctoringSettings;
