
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import apiRequest from "../../../services/api.js";

export default function Sessions() {
  const { refreshUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/auth/sessions");
      const items =
        response?.sessions ??
        response?.data?.sessions ??
        response?.data ??
        [];

      setSessions(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || "Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function revokeSession(sessionId) {
    if (!sessionId) {
      setError("This session does not have a valid ID.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/auth/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );

      setMessage("Session revoked successfully.");
      await loadSessions();
      await refreshUser();
    } catch (err) {
      setError(err.message || "Unable to revoke this session.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeAllSessions() {
    if (
      !window.confirm(
        "Are you sure you want to revoke all sessions? You may need to log in again.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/auth/sessions", { method: "DELETE" });

      setSessions([]);
      setMessage("Session revocation request completed.");
      await refreshUser();
    } catch (err) {
      setError(err.message || "Unable to revoke sessions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Active sessions"
      subtitle="Review and manage your Vettly sign-ins."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/profile"
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to profile
          </Link>

          <button
            type="button"
            disabled={busy || loading}
            onClick={revokeAllSessions}
            className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Revoke all sessions
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">
            No sessions were returned by the server.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const id = session.id ?? session.sessionId ?? session.session_id;
              const createdAt =
                session.createdAt ?? session.created_at;
              const expiresAt =
                session.expiresAt ?? session.expires_at;

              return (
                <div
                  key={id ?? index}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="break-all font-semibold text-slate-900 dark:text-white">
                        Session {index + 1}
                      </p>

                      {createdAt && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Created: {new Date(createdAt).toLocaleString()}
                        </p>
                      )}

                      {expiresAt && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Expires: {new Date(expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={busy || !id}
                      onClick={() => revokeSession(id)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
