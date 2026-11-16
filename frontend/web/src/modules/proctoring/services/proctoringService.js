
import interviewService from "../../interview/services/interviewService.js";

const enabledEventSettings = {
  COPY_ATTEMPT: "preventCopyPasteEnabled",
  CUT_ATTEMPT: "preventCopyPasteEnabled",
  PASTE_ATTEMPT: "preventCopyPasteEnabled",
  TAB_SWITCH: "tabSwitchDetectionEnabled",
  FULLSCREEN_EXIT: "fullscreenRequired",
  FACE_MISSING: "faceDetectionEnabled",
  LOOKING_AWAY: "faceDetectionEnabled",
  MULTIPLE_FACES: "multipleFaceDetectionEnabled",
  SUSPICIOUS_GESTURE: "suspiciousGestureDetectionEnabled",
  CAMERA_DISCONNECTED: "cameraDisconnectDetectionEnabled",
};

export function isEventEnabled(type, settings = {}) {
  const setting = enabledEventSettings[type];

  return Boolean(setting && settings[setting]);
}

export async function reportProctoringEvent(
  attemptId,
  type,
  details = {}
) {
  if (!attemptId) {
    throw new Error("An active attempt ID is required.");
  }

  if (!enabledEventSettings[type]) {
    throw new Error(`Unsupported proctoring event: ${type}`);
  }

  return interviewService.createProctoringEvent(attemptId, {
    type,
    occurredAt: new Date().toISOString(),
    details,
  });
}

export default {
  isEventEnabled,
  reportProctoringEvent,
};
