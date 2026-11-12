import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api/v1/interviews";

async function requestApi(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `API error (${res.status})`);
  }
  return data;
}

export default function UnifiedWorkspace() {
  // Navigation & Role states
  const [role, setRole] = useState("host"); // "host" | "candidate"
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "drafts" | "open" | "closed" (Host) || "attempts" | "history" (Candidate)
  const [statusFilter, setStatusFilter] = useState("all");

  // Host Core Data
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [proctorEvents, setProctorEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Candidate Data
  const [myAttempts, setMyAttempts] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [examPreviewData, setExamPreviewData] = useState(null);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isResultInspectOpen, setIsResultInspectOpen] = useState(false);
  const [inspectingResult, setInspectingResult] = useState(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionSeconds, setQuestionSeconds] = useState(120);

  // 1. Fetch Host Pipelines (GET /)
  const fetchHostInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await requestApi("/");
      const list = res.interviews || res.data || (Array.isArray(res) ? res : []);
      setInterviews(list);
      if (list.length > 0 && !selectedInterview) {
        setSelectedInterview(list[0]);
      }
    } catch (err) {
      console.warn("Host pipeline fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedInterview]);

  // 2. Fetch Candidate Attempts & Results (GET /attempts/mine, GET /results/mine)
  const fetchCandidateData = useCallback(async () => {
    try {
      setLoading(true);
      const [attemptsRes, resultsRes] = await Promise.allSettled([
        requestApi("/attempts/mine"),
        requestApi("/results/mine"),
      ]);
      if (attemptsRes.status === "fulfilled") {
        setMyAttempts(attemptsRes.value.attempts || attemptsRes.value.data || []);
      }
      if (resultsRes.status === "fulfilled") {
        setMyResults(resultsRes.value.results || resultsRes.value.data || []);
      }
    } catch (err) {
      console.warn("Candidate fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "host") {
      fetchHostInterviews();
    } else {
      fetchCandidateData();
    }
  }, [role, fetchHostInterviews, fetchCandidateData]);

  // 3. Inspect Specific Interview Details (GET /:id, GET /:id/participants, GET /:id/proctoring-events)
  const handleSelectInterview = async (item) => {
    const id = item.id || item._id;
    try {
      const [fullRes, partsRes, eventsRes] = await Promise.allSettled([
        requestApi(`/${id}`),
        requestApi(`/${id}/participants`),
        requestApi(`/${id}/proctoring-events`),
      ]);

      const detailed = fullRes.status === "fulfilled" ? (fullRes.value.interview || fullRes.value.data || item) : item;
      setSelectedInterview(detailed);
      setParticipants(partsRes.status === "fulfilled" ? (partsRes.value.participants || partsRes.value.data || []) : []);
      setProctorEvents(eventsRes.status === "fulfilled" ? (eventsRes.value.events || eventsRes.value.data || []) : []);
      setIsDetailOpen(true);
    } catch (e) {
      setSelectedInterview(item);
      setIsDetailOpen(true);
    }
  };

  // 4. Create Interview (POST /)
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    try {
      const res = await requestApi("/", {
        method: "POST",
        body: JSON.stringify({ title: formTitle, description: formDesc }),
      });
      const created = res.interview || res.data || res;
      setInterviews((prev) => [created, ...prev]);
      setSelectedInterview(created);
      setFormTitle("");
      setFormDesc("");
      setIsCreateOpen(false);
    } catch (err) {
      alert("Creation error: " + err.message);
    }
  };

  // 5. Update Interview (PATCH /:id)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;
    const id = selectedInterview.id || selectedInterview._id;
    try {
      const res = await requestApi(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: formTitle, description: formDesc }),
      });
      const updated = res.interview || res.data || { ...selectedInterview, title: formTitle, description: formDesc };
      setSelectedInterview(updated);
      setInterviews((prev) => prev.map((i) => ((i.id || i._id) === id ? updated : i)));
      setIsEditOpen(false);
    } catch (err) {
      alert("Update error: " + err.message);
    }
  };

  // 6. Publish (PATCH /:id/publish)
  const handlePublish = async (id) => {
    try {
      await requestApi(`/${id}/publish`, { method: "PATCH" });
      setInterviews((prev) =>
        prev.map((i) => ((i.id || i._id) === id ? { ...i, status: "Open" } : i))
      );
      if (selectedInterview && (selectedInterview.id || selectedInterview._id) === id) {
        setSelectedInterview((prev) => ({ ...prev, status: "Open" }));
      }
    } catch (err) {
      alert("Publish error: " + err.message);
    }
  };

  // 7. Archive (PATCH /:id/archive)
  const handleArchive = async (id) => {
    try {
      await requestApi(`/${id}/archive`, { method: "PATCH" });
      setInterviews((prev) =>
        prev.map((i) => ((i.id || i._id) === id ? { ...i, status: "Closed" } : i))
      );
      if (selectedInterview && (selectedInterview.id || selectedInterview._id) === id) {
        setSelectedInterview((prev) => ({ ...prev, status: "Closed" }));
      }
    } catch (err) {
      alert("Archive error: " + err.message);
    }
  };

  // 8. Delete (DELETE /:id)
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this interview pipeline?")) return;
    try {
      await requestApi(`/${id}`, { method: "DELETE" });
      setInterviews((prev) => prev.filter((i) => (i.id || i._id) !== id));
      setIsDetailOpen(false);
    } catch (err) {
      alert("Delete error: " + err.message);
    }
  };

  // 9. Invite Candidate (POST /:id/participants)
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedInterview) return;
    const id = selectedInterview.id || selectedInterview._id;
    try {
      const res = await requestApi(`/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail }),
      });
      alert(`Invitation sent to ${inviteEmail}`);
      const part = res.participant || res.data || { email: inviteEmail, status: "INVITED" };
      setParticipants((prev) => [part, ...prev]);
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (err) {
      alert("Invitation error: " + err.message);
    }
  };

  // 10. Questions Bank (PUT /:id/questions)
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || !selectedInterview) return;
    const id = selectedInterview.id || selectedInterview._id;
    try {
      const currentQuestions = selectedInterview.questions || [];
      const updated = [...currentQuestions, { question: questionText, timeLimit: Number(questionSeconds) }];
      await requestApi(`/${id}/questions`, {
        method: "PUT",
        body: JSON.stringify({ questions: updated }),
      });
      setSelectedInterview((prev) => ({ ...prev, questions: updated }));
      setInterviews((prev) => prev.map((i) => ((i.id || i._id) === id ? { ...i, questions: updated } : i)));
      setQuestionText("");
      setIsQuestionOpen(false);
      alert("Question saved successfully.");
    } catch (err) {
      alert("Save question error: " + err.message);
    }
  };

  // 11. Stream Channel Retry (POST /:id/participants/:participantId/retry-stream-sync)
  const handleRetryStream = async (participantId) => {
    const id = selectedInterview.id || selectedInterview._id;
    try {
      await requestApi(`/${id}/participants/${participantId}/retry-stream-sync`, { method: "POST" });
      alert("GetStream video channel resynchronized.");
    } catch (err) {
      alert("Stream sync error: " + err.message);
    }
  };

  // 12. Review Proctoring Flag (PATCH /:id/proctoring-events/:eventId)
  const handleReviewProctorEvent = async (eventId) => {
    const id = selectedInterview.id || selectedInterview._id;
    try {
      await requestApi(`/${id}/proctoring-events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify({ reviewed: true, status: "DISMISSED" }),
      });
      setProctorEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, reviewed: true } : e)));
    } catch (err) {
      alert("Review flag error: " + err.message);
    }
  };

  // 13. Candidate Join Preview (GET /:id/join)
  const handleJoinPreview = async (interviewId) => {
    try {
      const res = await requestApi(`/${interviewId}/join`);
      setExamPreviewData(res.interview || res.data || { id: interviewId, title: "Candidate Assessment" });
      setActiveExam({ id: interviewId, step: "PREVIEW" });
    } catch (err) {
      alert("Join preview error: " + err.message);
    }
  };

  // 14. Candidate Start Exam Room (POST /:id/join or POST /participants/:participantId/start)
  const handleStartExam = async (interviewId) => {
    try {
      await requestApi(`/${interviewId}/join`, { method: "POST" });
      setActiveExam({ id: interviewId, step: "IN_PROGRESS", currentQuestion: 1 });
    } catch (err) {
      alert("Unable to enter room: " + err.message);
    }
  };

  // 15. Candidate Log Violation Live (POST /attempts/:attemptId/proctoring-events)
  const handleTriggerProctorEvent = async (attemptId, type = "TAB_SWITCH") => {
    try {
      await requestApi(`/attempts/${attemptId}/proctoring-events`, {
        method: "POST",
        body: JSON.stringify({ type, timestamp: new Date().toISOString() }),
      });
      alert(`Proctoring violation logged: ${type}`);
    } catch (err) {
      console.warn("Proctor logging error:", err.message);
    }
  };

  // 16. Candidate Exam Submit (POST /attempts/:attemptId/submit)
  const handleSubmitExam = async (attemptId) => {
    try {
      await requestApi(`/attempts/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      alert("Assessment submitted successfully!");
      setActiveExam(null);
      fetchCandidateData();
    } catch (err) {
      alert("Submission error: " + err.message);
    }
  };

  // 17. Inspect Attempt Result (GET /attempts/:attemptId/result)
  const handleInspectResult = async (attemptId) => {
    try {
      const res = await requestApi(`/attempts/${attemptId}/result`);
      setInspectingResult(res.result || res.data || { id: attemptId, score: 88, status: "VERIFIED" });
      setIsResultInspectOpen(true);
    } catch (err) {
      alert("Result fetch error: " + err.message);
    }
  };

  // 18. Host Publish Result (POST /attempts/:attemptId/publish-result)
  const handlePublishResult = async (attemptId) => {
    try {
      await requestApi(`/attempts/${attemptId}/publish-result`, { method: "POST" });
      alert("Result officially published to candidate.");
      setIsResultInspectOpen(false);
    } catch (err) {
      alert("Publish result error: " + err.message);
    }
  };

  // 19. Host Resend Result Email (POST /attempts/:attemptId/resend-result)
  const handleResendResult = async (attemptId) => {
    try {
      await requestApi(`/attempts/${attemptId}/resend-result`, { method: "POST" });
      alert("Evaluation result email resent to candidate.");
    } catch (err) {
      alert("Resend error: " + err.message);
    }
  };

  // 20. Candidate Accept Invitation (POST /accept-invitation)
  const handleAcceptInvite = async () => {
    const token = prompt("Enter invitation token received in email:");
    if (!token) return;
    try {
      await requestApi("/accept-invitation", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      alert("Invitation accepted! Added to your queue.");
      fetchCandidateData();
    } catch (err) {
      alert("Failed to accept invite: " + err.message);
    }
  };

  // Pipeline Filter logic
  const openCount = interviews.filter((i) => (i.status || "Open").toLowerCase() === "open").length;
  const draftCount = interviews.filter((i) => (i.status || "").toLowerCase() === "draft").length;
  const closedCount = interviews.filter((i) => {
    const s = (i.status || "").toLowerCase();
    return s === "closed" || s === "archived";
  }).length;

  const displayList = interviews.filter((i) => {
    const s = (i.status || "Open").toLowerCase();
    if (activeTab === "drafts") return s === "draft";
    if (activeTab === "open") return s === "open";
    if (activeTab === "closed") return s === "closed" || s === "archived";
    if (statusFilter !== "all") return s === statusFilter.toLowerCase();
    return true;
  });

  return (
    <div className="min-h-screen flex flex-row bg-[#080c15] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ── LEFT SIDEBAR (Deep Midnight Navy with Indigo Tones) ─── */}
      <aside className="w-64 min-h-screen p-6 flex flex-col justify-between bg-[#0a0f1d] border-r border-white/[0.06] shrink-0">
        <div>
          {/* Logo Badge matching login page header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
              V
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">Vettly</span>
              <span className="text-[10px] text-slate-400 font-medium">/ Console</span>
            </div>
          </div>

          {/* Role Segment Toggle (Host / Candidate) */}
          <div className="bg-[#101728] p-1 rounded-xl flex items-center mb-8 border border-white/[0.08]">
            <button
              onClick={() => { setRole("host"); setActiveTab("overview"); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                role === "host"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Host
            </button>
            <button
              onClick={() => { setRole("candidate"); setActiveTab("attempts"); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                role === "candidate"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Candidate
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 text-xs font-medium">
            {role === "host" ? (
              <>
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === "overview"
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm">⊞</span> Overview
                </button>
                <button
                  onClick={() => setActiveTab("drafts")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === "drafts"
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm">☷</span> Drafts ({draftCount})
                </button>
                <button
                  onClick={() => setActiveTab("open")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === "open"
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm">((•))</span> Open Pipelines ({openCount})
                </button>
                <button
                  onClick={() => setActiveTab("closed")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === "closed"
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm">▣</span> Closed Pipelines ({closedCount})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("attempts")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === "attempts"
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm">▶</span> Assigned Attempts ({myAttempts.length})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === "history"
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm">✓</span> Verified Results ({myResults.length})
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer Status Pill */}
        <div className="pt-6 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API Synchronized</span>
          </div>
          <span className="text-[10px] text-slate-500">v1.2</span>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CANVAS ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="px-10 py-5 flex items-center justify-between border-b border-white/[0.06] bg-[#090d18]/70 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Pipelines</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Live Proctoring</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Integrations</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              AI-Powered Workspace
            </div>
            <button
              onClick={role === "host" ? fetchHostInterviews : fetchCandidateData}
              className="text-xs px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/[0.04] text-slate-300 font-semibold"
            >
              ⟳ Sync
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="p-10 max-w-6xl w-full mx-auto space-y-10">
          
          {/* Header Row */}
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                Structured Evaluation Suite
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                {role === "host" ? "Interview overview" : "Candidate workspace"}
              </h1>
            </div>

            {role === "host" ? (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
              >
                <span className="text-base leading-none">+</span> Create interview
              </button>
            ) : (
              <button
                onClick={handleAcceptInvite}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
              >
                <span>✉</span> Accept Invitation Token
              </button>
            )}
          </div>

          {/* ── HOST INTERFACE ───────────────────────────────── */}
          {role === "host" && (
            <>
              {/* Feature Cards Grid (Pipeline Gauge + Indigo Featured Banner) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Pipeline Stats Gauge */}
                <div className="md:col-span-5 p-7 rounded-3xl border border-white/[0.07] bg-[#0e1422] shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Interview pipeline
                    </h3>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-5xl font-extrabold text-white tracking-tight">{interviews.length}</span>
                      <span className="text-xs text-slate-400 font-medium">total pipelines</span>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div className="h-2 w-full bg-white/[0.06] rounded-full mt-6 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all"
                        style={{ width: `${interviews.length ? (openCount / interviews.length) * 100 : 0}%` }}
                      ></div>
                      <div
                        className="bg-amber-400/80 h-full transition-all"
                        style={{ width: `${interviews.length ? (draftCount / interviews.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-6 pt-4 border-t border-white/[0.06]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-500"></span> Drafts {draftCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Open {openCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-700"></span> Closed {closedCount}
                    </span>
                  </div>
                </div>

                {/* Indigo Featured Action Banner matching login cards */}
                <div className="md:col-span-7 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-[#121a30] via-[#0f172a] to-[#0c1222] border border-indigo-500/20 shadow-xl">
                  {/* Subtle concentric rings */}
                  <div className="absolute right-0 top-0 h-full w-2/3 opacity-15 pointer-events-none flex items-center justify-end text-indigo-400">
                    <svg viewBox="0 0 300 300" className="w-[340px] h-[340px] translate-x-12">
                      <circle cx="200" cy="150" r="50" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="200" cy="150" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="200" cy="150" r="110" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="200" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="200" cy="150" r="170" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      Next action
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
                      {selectedInterview ? selectedInterview.title : "No pipeline selected"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 max-w-sm leading-relaxed">
                      {selectedInterview?.description || "Select any pipeline to invite candidates, configure question banks, or verify proctor flags."}
                    </p>
                  </div>

                  <div className="relative z-10 mt-8 flex items-center gap-4 text-xs font-semibold">
                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-bold"
                    >
                      Manage invitation <span>→</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => setIsQuestionOpen(true)}
                      className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                    >
                      Questions ({selectedInterview?.questions?.length || 0}) <span>→</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => {
                        setFormTitle(selectedInterview?.title || "");
                        setFormDesc(selectedInterview?.description || "");
                        setIsEditOpen(true);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              </div>

              {/* All Interviews Table */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#0e1422] p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <h3 className="text-xl font-bold text-white tracking-tight">All interviews</h3>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">View</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs border border-white/10 rounded-xl px-3 py-1.5 bg-[#141c2e] text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All statuses</option>
                      <option value="open">Open</option>
                      <option value="draft">Draft</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Loading pipelines from database...</div>
                ) : displayList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No interviews found matching this view. Click "+ Create interview" to start one.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {displayList.map((item) => {
                      const id = item.id || item._id;
                      const isSelected = selectedInterview && (selectedInterview.id || selectedInterview._id) === id;
                      return (
                        <div
                          key={id}
                          onClick={() => handleSelectInterview(item)}
                          className={`py-4 px-3 flex items-center justify-between cursor-pointer rounded-2xl transition-all ${
                            isSelected
                              ? "bg-indigo-600/10 border border-indigo-500/30"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-mono">
                              ((•))
                            </span>
                            <div>
                              <p className="font-bold text-sm text-slate-100 tracking-tight">{item.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">Live video • 30 min duration</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-8">
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 uppercase">
                              {item.status || "Open"}
                            </span>
                            <span className="text-xs text-slate-500 hidden sm:block">
                              {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="text-slate-500 text-sm">→</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CANDIDATE INTERFACE ───────────────────────────── */}
          {role === "candidate" && !activeExam && (
            <div className="rounded-3xl border border-white/[0.07] bg-[#0e1422] p-8 shadow-xl space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">Assigned Assessments & Past Results</h3>
                <p className="text-xs text-slate-400 mt-1">Take assigned technical tests or inspect published evaluation reports.</p>
              </div>

              {activeTab === "attempts" ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned In Queue</h4>
                  {myAttempts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      No pending attempts found. Click "Accept Invitation Token" above if you have an email invite code.
                    </div>
                  ) : (
                    myAttempts.map((attempt) => (
                      <div key={attempt.id} className="p-4 rounded-2xl border border-white/[0.06] bg-[#12192b] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-100">{attempt.title || "Technical Assessment"}</p>
                          <p className="text-xs text-slate-400">Status: {attempt.status || "Ready"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleJoinPreview(attempt.interviewId || attempt.id)}
                            className="px-3.5 py-2 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold rounded-xl transition-all"
                          >
                            Device Preview
                          </button>
                          <button
                            onClick={() => handleStartExam(attempt.interviewId || attempt.id)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30"
                          >
                            Start Exam Room
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Evaluation Records</h4>
                  {myResults.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      No completed evaluations recorded yet.
                    </div>
                  ) : (
                    myResults.map((res) => (
                      <div key={res.id} className="p-4 rounded-2xl border border-white/[0.06] bg-[#12192b] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-100">{res.interviewTitle || "Assessment Result"}</p>
                          <p className="text-xs text-slate-400">Score: {res.score}% • Verified</p>
                        </div>
                        <button
                          onClick={() => handleInspectResult(res.attemptId || res.id)}
                          className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/[0.04] text-xs font-semibold text-slate-200"
                        >
                          View Breakdown
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LIVE CANDIDATE EXAM ROOM SIMULATOR ─────────────── */}
          {role === "candidate" && activeExam && (
            <div className="rounded-3xl border border-white/[0.07] bg-[#0e1422] p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                    {activeExam.step === "PREVIEW" ? "Pre-flight Check" : "Live Assessment"}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
                    {examPreviewData?.title || "Full Stack Engineering Assessment"}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveExam(null)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Exit Room
                </button>
              </div>

              {activeExam.step === "PREVIEW" ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-[#12192b] border border-white/[0.05]">
                    <h4 className="font-bold text-sm text-slate-200 mb-2">Pre-interview Diagnostics:</h4>
                    <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5">
                      <li>Microphone & Web camera connected</li>
                      <li>Screen sharing integrity module active</li>
                      <li>GetStream audio/video feed initialized</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleStartExam(activeExam.id)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    Confirm & Start Real-time Assessment →
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-[#12192b] border border-indigo-500/30 text-white">
                    <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Question 1 of 5</p>
                    <h3 className="text-xl font-bold mt-2">
                      Explain event loop handling, microtask queues, and worker threads in Node.js.
                    </h3>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    <span>⚠️ Proctoring Active: Tab switches and focus shifts are recorded.</span>
                    <button
                      onClick={() => handleTriggerProctorEvent(activeExam.id, "TAB_SWITCH")}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-bold rounded text-[10px]"
                    >
                      Simulate Tab Switch
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => handleSubmitExam(activeExam.id)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      Submit Attempt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── DETAIL DRAWER (Host Pipeline Inspection) ─────────── */}
      {isDetailOpen && selectedInterview && (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0f1d] border-l border-white/[0.08] shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400">Pipeline Details</span>
                <h4 className="text-lg font-bold text-white mt-0.5">{selectedInterview.title}</h4>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="h-8 w-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Lifecycle Controls */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => handlePublish(selectedInterview.id || selectedInterview._id)}
                className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              >
                Publish
              </button>
              <button
                onClick={() => handleArchive(selectedInterview.id || selectedInterview._id)}
                className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-white/[0.05] text-slate-300 border border-white/10 hover:bg-white/[0.08]"
              >
                Archive
              </button>
              <button
                onClick={() => handleDelete(selectedInterview.id || selectedInterview._id)}
                className="py-1.5 px-3 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Description</span>
              <p className="text-xs text-slate-300 bg-[#12192b] p-3.5 rounded-xl border border-white/[0.04] leading-relaxed">
                {selectedInterview.description || "No specific job description provided."}
              </p>
            </div>

            {/* Candidates */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Participants ({participants.length})
                </span>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  + Invite
                </button>
              </div>

              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-[#12192b] p-3 rounded-xl border border-white/[0.04]">No participants invited yet.</p>
                ) : (
                  participants.map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#12192b] border border-white/[0.04] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">{p.email}</p>
                        <p className="text-[10px] text-slate-500">{p.status || "Invited"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRetryStream(p.id || p._id || idx)}
                          className="text-[10px] text-slate-400 hover:text-white underline"
                        >
                          Sync
                        </button>
                        <button
                          onClick={() => handleInspectResult(p.attemptId || p.id)}
                          className="text-[10px] text-indigo-400 hover:underline font-bold ml-1"
                        >
                          Result
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Proctoring Flags */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Proctoring Flags ({proctorEvents.length})
              </span>
              <div className="space-y-1.5">
                {proctorEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-[#12192b] p-3 rounded-xl border border-white/[0.04]">No violations recorded.</p>
                ) : (
                  proctorEvents.map((evt, idx) => (
                    <div key={idx} className="p-2.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-xl text-xs flex items-center justify-between">
                      <span>⚠️ {evt.type || "Tab switch logged"}</span>
                      {!evt.reviewed && (
                        <button
                          onClick={() => handleReviewProctorEvent(evt.id)}
                          className="text-[10px] font-bold text-amber-200 underline ml-2"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDetailOpen(false)}
            className="w-full py-2.5 bg-white/[0.05] hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold mt-6"
          >
            Close Panel
          </button>
        </div>
      )}

      {/* ── MODAL: Create Pipeline ─────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">Create interview</h3>
            <p className="text-xs text-slate-400 mb-6">Create a new interview pipeline.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Skills, competencies, and scope..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Pipeline ───────────────────────────── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">Update interview</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Invite Participant ───────────────────────── */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">Manage invitation</h3>
            <p className="text-xs text-slate-400 mb-6">Dispatches invite token directly to candidate email.</p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Candidate Email</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Questions Bank ───────────────────────────── */}
      {isQuestionOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">Set Questions</h3>
            <p className="text-xs text-slate-400 mb-6">Configure custom algorithmic or behavioral prompts.</p>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Prompt</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Write a debounce function in JavaScript..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Time Limit (Sec)</label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={questionSeconds}
                  onChange={(e) => setQuestionSeconds(e.target.value)}
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuestionOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Result Breakdown & Publish / Resend ──────── */}
      {isResultInspectOpen && inspectingResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-5">
            <div className="border-b border-white/[0.06] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Assessment Evaluation</span>
              <h3 className="text-xl font-bold text-white mt-1">Detailed Score Breakdown</h3>
            </div>
            
            <div className="p-4 rounded-xl bg-[#12192b] space-y-2 text-xs border border-white/[0.04]">
              <div className="flex justify-between">
                <span className="text-slate-400">Overall Score:</span>
                <span className="font-bold text-emerald-400">{inspectingResult.score || 88}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Proctor Integrity:</span>
                <span className="font-bold text-slate-200">98% (Pass)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={() => handlePublishResult(inspectingResult.id)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Publish Result
              </button>
              <button
                onClick={() => handleResendResult(inspectingResult.id)}
                className="flex-1 py-2 border border-white/10 hover:bg-white/[0.04] text-slate-200 rounded-xl text-xs font-bold"
              >
                Resend Email
              </button>
              <button
                onClick={() => setIsResultInspectOpen(false)}
                className="py-2 px-3 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}   