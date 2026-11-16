
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isEventEnabled,
  reportProctoringEvent,
} from "../services/proctoringService.js";

function ProctoringMonitor({
  attemptId,
  settings = {},
  initialWarningCount = 0,
  onWarning,
  onTerminated,
  onFullscreenStatusChange,
}) {
  const [cameraStatus, setCameraStatus] = useState("NOT_STARTED");
  const [cameraError, setCameraError] = useState("");
  const [message, setMessage] = useState("");
  const [warningCount, setWarningCount] = useState(initialWarningCount);
  const [terminated, setTerminated] = useState(false);

  const [fullscreenActive, setFullscreenActive] = useState(() =>
    typeof document !== "undefined"
      ? Boolean(document.fullscreenElement)
      : false
  );

  const cameraStreamRef = useRef(null);
  const lastReportedRef = useRef({});
  const reportingRef = useRef({});
  const terminatedRef = useRef(false);
  const hasEnteredFullscreenRef = useRef(false);
  const activeAttemptIdRef = useRef(attemptId);

  const warningLimit = Math.max(
    1,
    Number(settings.warningLimit) || 3
  );

  // Reset monitoring state whenever a different attempt is loaded.
  useEffect(() => {
    activeAttemptIdRef.current = attemptId;

    terminatedRef.current = false;
    hasEnteredFullscreenRef.current =
      typeof document !== "undefined" &&
      Boolean(document.fullscreenElement);

    lastReportedRef.current = {};
    reportingRef.current = {};

    setWarningCount(Number(initialWarningCount) || 0);
    setTerminated(false);
    setMessage("");
    setCameraError("");
    setCameraStatus("NOT_STARTED");

    setFullscreenActive(
      typeof document !== "undefined" &&
        Boolean(document.fullscreenElement)
    );

    const oldStream = cameraStreamRef.current;

    if (oldStream) {
      oldStream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    return () => {
      const stream = cameraStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [attemptId]);

  // Synchronize warning count if the parent receives updated attempt data.
  useEffect(() => {
    setWarningCount(Number(initialWarningCount) || 0);
  }, [initialWarningCount]);

  const reportEvent = useCallback(
    async (type, details = {}) => {
      const currentAttemptId = attemptId;

      if (!currentAttemptId || terminatedRef.current) return;

      if (
        activeAttemptIdRef.current !== currentAttemptId ||
        !isEventEnabled(type, settings)
      ) {
        return;
      }

      const now = Date.now();
      const previous = lastReportedRef.current[type] || 0;

      // Avoid duplicate reports within three seconds.
      if (now - previous < 3000 || reportingRef.current[type]) {
        return;
      }

      lastReportedRef.current[type] = now;
      reportingRef.current[type] = true;

      try {
        const response = await reportProctoringEvent(
          currentAttemptId,
          type,
          details
        );

        // Ignore responses belonging to an older attempt.
        if (activeAttemptIdRef.current !== currentAttemptId) {
          return;
        }

        if (response?.countedAsWarning) {
          const nextCount = Number(response.warningCount ?? 0);
          const limit = Number(response.warningLimit) || warningLimit;

          setWarningCount(nextCount);
          setMessage(
            `Security warning ${nextCount} of ${limit}.`
          );

          onWarning?.(response);
        }

        if (response?.terminated) {
          terminatedRef.current = true;

          setTerminated(true);
          setMessage("Your assessment has been terminated.");

          onTerminated?.(response);
        }
      } catch (error) {
        if (activeAttemptIdRef.current === currentAttemptId) {
          setMessage(
            error.message ||
              "Could not record the monitoring event."
          );
        }
      } finally {
        if (activeAttemptIdRef.current === currentAttemptId) {
          reportingRef.current[type] = false;
        }
      }
    },
    [
      attemptId,
      settings,
      warningLimit,
      onWarning,
      onTerminated,
    ]
  );

  // Browser visibility and fullscreen monitoring.
  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.hidden &&
        isEventEnabled("TAB_SWITCH", settings)
      ) {
        reportEvent("TAB_SWITCH", {
          source: "document_visibility",
          visibilityState: document.visibilityState,
        });
      }
    }

    function handleFullscreenChange() {
      const active = Boolean(document.fullscreenElement);

      setFullscreenActive(active);

      if (active) {
        hasEnteredFullscreenRef.current = true;
        return;
      }

      if (
        hasEnteredFullscreenRef.current &&
        isEventEnabled("FULLSCREEN_EXIT", settings)
      ) {
        reportEvent("FULLSCREEN_EXIT", {
          source: "fullscreen_change",
        });
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [settings, reportEvent]);

  // Notify the parent when fullscreen status changes.
  useEffect(() => {
    onFullscreenStatusChange?.(fullscreenActive);
  }, [fullscreenActive, onFullscreenStatusChange]);

  // Clipboard monitoring.
  useEffect(() => {
    if (!settings.preventCopyPasteEnabled) return;

    function handleClipboard(event) {
      const eventTypes = {
        copy: "COPY_ATTEMPT",
        cut: "CUT_ATTEMPT",
        paste: "PASTE_ATTEMPT",
      };

      const type = eventTypes[event.type];

      if (!type) return;

      event.preventDefault();

      reportEvent(type, {
        source: "clipboard_event",
        eventType: event.type,
      });
    }

    document.addEventListener("copy", handleClipboard, true);
    document.addEventListener("cut", handleClipboard, true);
    document.addEventListener("paste", handleClipboard, true);

    return () => {
      document.removeEventListener("copy", handleClipboard, true);
      document.removeEventListener("cut", handleClipboard, true);
      document.removeEventListener("paste", handleClipboard, true);
    };
  }, [settings.preventCopyPasteEnabled, reportEvent]);

  // Release any previous camera stream.
  const stopCamera = useCallback(() => {
    const stream = cameraStreamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  // Request camera permission only after the candidate clicks.
  const startCamera = async () => {
    setCameraError("");
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("UNAVAILABLE");
      setCameraError(
        "Camera access is unavailable. Use a supported browser over HTTPS or localhost."
      );
      return;
    }

    stopCamera();

    const currentAttemptId = attemptId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Do not attach a camera stream to an old attempt.
      if (activeAttemptIdRef.current !== currentAttemptId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStreamRef.current = stream;
      setCameraStatus("CONNECTED");

      stream.getVideoTracks().forEach((track) => {
        track.addEventListener(
          "ended",
          () => {
            if (
              activeAttemptIdRef.current !== currentAttemptId
            ) {
              return;
            }

            setCameraStatus("DISCONNECTED");

            reportEvent("CAMERA_DISCONNECTED", {
              source: "media_track_ended",
            });
          },
          { once: true }
        );

        track.addEventListener("mute", () => {
          if (
            activeAttemptIdRef.current === currentAttemptId
          ) {
            setCameraStatus("INTERRUPTED");
          }
        });

        track.addEventListener("unmute", () => {
          if (
            activeAttemptIdRef.current === currentAttemptId
          ) {
            setCameraStatus("CONNECTED");
          }
        });
      });
    } catch (error) {
      if (activeAttemptIdRef.current !== currentAttemptId) {
        return;
      }

      setCameraStatus("DENIED");

      setCameraError(
        error.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings."
          : error.name === "NotFoundError"
            ? "No camera was found on this device."
            : "Unable to access the camera."
      );
    }
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setMessage(
        "Fullscreen could not be enabled by this browser."
      );
    }
  };

  const cameraEnabled = Boolean(
    settings.cameraDisconnectDetectionEnabled
  );

  const fullscreenRequired = Boolean(
    settings.fullscreenRequired
  );

  const clipboardEnabled = Boolean(
    settings.preventCopyPasteEnabled
  );

  const tabDetectionEnabled = Boolean(
    settings.tabSwitchDetectionEnabled
  );

  const remainingWarnings = Math.max(
    0,
    warningLimit - warningCount
  );

  const activeChecks = [
    clipboardEnabled && "Clipboard monitoring",
    tabDetectionEnabled && "Page visibility monitoring",
    fullscreenRequired && "Fullscreen monitoring",
    cameraEnabled && "Camera connection monitoring",
  ].filter(Boolean);

  const monitoringActive = activeChecks.length > 0;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            Assessment monitoring
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Only configured and implemented browser/device checks
            are monitored.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            monitoringActive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              monitoringActive
                ? "bg-emerald-500"
                : "bg-slate-400"
            }`}
          />

          {monitoringActive
            ? "Monitoring configured checks"
            : "No active browser checks"}
        </span>
      </div>

      {activeChecks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChecks.map((check) => (
            <span
              key={check}
              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              {check}
            </span>
          ))}
        </div>
      )}

      {/* Warning progress */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              Security warnings
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The configured limit is {warningLimit}.
            </p>
          </div>

          <span
            className={`rounded-lg px-3 py-2 text-sm font-bold ${
              warningCount >= warningLimit
                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                : warningCount > 0
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {warningCount} / {warningLimit}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${
              warningCount > 0
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                (warningCount / warningLimit) * 100
              )}%`,
            }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {remainingWarnings} warning(s) remaining before the
          configured limit.
        </p>
      </div>

      {/* Fullscreen */}
      {fullscreenRequired && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium">
              Fullscreen mode
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {fullscreenActive
                ? "Fullscreen is currently active."
                : "Enter fullscreen before continuing."}
            </p>
          </div>

          {!fullscreenActive && (
            <button
              type="button"
              onClick={enterFullscreen}
              disabled={terminated}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Enter fullscreen
            </button>
          )}
        </div>
      )}

      {/* Camera */}
      {cameraEnabled && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium">
              Camera connection
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Status: {cameraStatus.replaceAll("_", " ").toLowerCase()}
            </p>
          </div>

          {[
            "NOT_STARTED",
            "DENIED",
            "DISCONNECTED",
            "UNAVAILABLE",
          ].includes(cameraStatus) && (
            <button
              type="button"
              onClick={startCamera}
              disabled={terminated}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {cameraStatus === "NOT_STARTED"
                ? "Allow camera access"
                : "Reconnect camera"}
            </button>
          )}
        </div>
      )}

      {cameraError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300"
        >
          {cameraError}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
        >
          {message}
        </p>
      )}

      <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
          Monitoring events are recorded for review. Browser
          activity and camera connection signals can be inaccurate
          and should not automatically be treated as proof of
          misconduct. Camera access requires your permission.
          Face, gaze and gesture detection require separate
          computer-vision implementation.
        </p>
      </div>
    </section>
  );
}

export default ProctoringMonitor;
