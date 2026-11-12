
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RoleSwitcher from "../components/RoleSwitcher.jsx";
import InterviewSidebar from "../components/InterviewSidebar.jsx";
import InterviewNavbar from "../components/InterviewNavbar.jsx";
import InterviewCard from "../components/InterviewCard.jsx";

import interviewService from "../services/interviewService.js";

import "../styles/interview.css";

function InterviewDashboard() {
  const navigate = useNavigate();

  const [role, setRole] = useState("HOST");
  const [activeItem, setActiveItem] = useState("Overview");

  const [interviews, setInterviews] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load data whenever the user switches modes.
  useEffect(() => {
    loadDashboardData();
  }, [role]);

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    try {
      if (role === "HOST") {
        const response = await interviewService.listInterviews({
          page: 1,
          limit: 100,
        });

        setInterviews(response?.data?.interviews || []);
      } else {
        const [attemptResponse, resultResponse] =
          await Promise.all([
            interviewService.getMyAttempts({ page: 1 }),
            interviewService.getMyResults(),
          ]);

        setAttempts(
          attemptResponse?.data?.attempts ||
          attemptResponse?.data ||
          []
        );

        setResults(
          resultResponse?.data?.results ||
          resultResponse?.data ||
          []
        );
      }
    } catch (err) {
      console.error("Interview dashboard error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  function handleRoleChange(newRole) {
    setRole(newRole);
    setActiveItem("Overview");
  }

  function handleNavigation(item) {
    setActiveItem(item);
  }

  function handleCreateInterview() {
    navigate("/interviews/create");
  }

  const draftCount = interviews.filter(
    (item) => item.status === "DRAFT"
  ).length;

  const publishedCount = interviews.filter(
    (item) => item.status === "PUBLISHED"
  ).length;

  const archivedCount = interviews.filter(
    (item) => item.status === "ARCHIVED"
  ).length;

  const totalAttempts = attempts.length;

  function getVisibleInterviews() {
    if (activeItem === "Drafts") {
      return interviews.filter(
        (item) => item.status === "DRAFT"
      );
    }

    if (activeItem === "Published") {
      return interviews.filter(
        (item) => item.status === "PUBLISHED"
      );
    }

    if (activeItem === "Archived") {
      return interviews.filter(
        (item) => item.status === "ARCHIVED"
      );
    }

    return interviews;
  }

  function renderHostContent() {
    const visibleInterviews = getVisibleInterviews();

    if (activeItem === "Overview") {
      return (
        <>
          <div className="interview-welcome">
            <div>
              <span className="welcome-tag">
                HOST WORKSPACE
              </span>

              <h1>Welcome to your interview hub.</h1>

              <p>
                Create interviews, invite candidates and
                manage the entire interview process.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={handleCreateInterview}
            >
              + Create Interview
            </button>
          </div>

          <div className="stats-grid">
            <InterviewCard
              title="Total Interviews"
              value={interviews.length}
              description="Interviews you have created"
            />

            <InterviewCard
              title="Drafts"
              value={draftCount}
              description="Interviews waiting to publish"
            />

            <InterviewCard
              title="Published"
              value={publishedCount}
              description="Interviews available to candidates"
            />

            <InterviewCard
              title="Archived"
              value={archivedCount}
              description="Closed interviews"
            />
          </div>

          <div className="content-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Interviews</h2>
                <p>Manage your latest interviews.</p>
              </div>

              <button
                className="text-btn"
                onClick={() => setActiveItem("My Interviews")}
              >
                View all
              </button>
            </div>

            {renderInterviewList(interviews.slice(0, 5))}
          </div>
        </>
      );
    }

    return (
      <div className="content-panel">
        <div className="panel-heading">
          <div>
            <h2>{activeItem}</h2>
            <p>Manage your interview records.</p>
          </div>

          <button
            className="primary-btn"
            onClick={handleCreateInterview}
          >
            + Create Interview
          </button>
        </div>

        {renderInterviewList(visibleInterviews)}
      </div>
    );
  }

  function renderInterviewList(items) {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <h3>No interviews found</h3>
          <p>
            Create your first interview to get started.
          </p>

          <button
            className="primary-btn"
            onClick={handleCreateInterview}
          >
            Create Interview
          </button>
        </div>
      );
    }

    return (
      <div className="interview-list">
        {items.map((interview) => (
          <div
            className="interview-list-item"
            key={interview.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/interviews/${interview.id}`)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/interviews/${interview.id}`);
                }
            }}
            >
                
            <div className="interview-item-info">
              <h3>{interview.title}</h3>

              <p>
                {interview.description ||
                  "No description provided."}
              </p>

              <span className="interview-format">
                {interview.format || "LIVE"}
              </span>
            </div>

            <span
              className={`status-badge ${(
                interview.status || "DRAFT"
              ).toLowerCase()}`}
            >
              {interview.status || "DRAFT"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  function renderCandidateContent() {
    if (activeItem === "Overview") {
      return (
        <>
          <div className="interview-welcome">
            <div>
              <span className="welcome-tag">
                CANDIDATE WORKSPACE
              </span>

              <h1>Your next opportunity starts here.</h1>

              <p>
                Track your interview attempts, invitations
                and results in one place.
              </p>
            </div>
          </div>

          <div className="stats-grid">
            <InterviewCard
              title="Total Attempts"
              value={totalAttempts}
              description="All your interview attempts"
            />

            <InterviewCard
              title="Active Attempts"
              value={attempts.filter(
                (item) => item.status === "IN_PROGRESS"
              ).length}
              description="Interviews currently in progress"
            />

            <InterviewCard
              title="Completed Results"
              value={results.length}
              description="Your completed interview results"
            />
          </div>

          <div className="content-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Attempts</h2>
                <p>Keep track of your interview activity.</p>
              </div>

              <button
                className="text-btn"
                onClick={() => setActiveItem("My Attempts")}
              >
                View all
              </button>
            </div>

            {renderCandidateAttempts(attempts.slice(0, 5))}
          </div>
        </>
      );
    }

    if (activeItem === "Invitations") {
      return (
        <div className="content-panel">
          <h2>Interview Invitations</h2>
          <p>
            Open your invitation email to accept an
            interview invitation and join.
          </p>

          <div className="empty-state">
            <h3>Check your email for invitations</h3>
            <p>
              Invitations are sent directly by interview
              hosts. You can join using the invitation link.
            </p>
          </div>
        </div>
      );
    }

    if (activeItem === "My Results") {
      return (
        <div className="content-panel">
          <div className="panel-heading">
            <div>
              <h2>My Results</h2>
              <p>Your completed interview results.</p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>No results available</h3>
              <p>Your published results will appear here.</p>
            </div>
          ) : (
            <div className="interview-list">
              {results.map((result, index) => (
                <div
                  className="interview-list-item"
                  key={result.id || result.attemptId || index}
                >
                  <div>
                    <h3>
                      {result.interview?.title ||
                        result.interviewTitle ||
                        "Interview Result"}
                    </h3>

                    <p>
                      Score: {result.score ?? "Not available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="content-panel">
        <div className="panel-heading">
          <div>
            <h2>My Attempts</h2>
            <p>View your interview attempts.</p>
          </div>
        </div>

        {renderCandidateAttempts(attempts)}
      </div>
    );
  }

  function renderCandidateAttempts(items) {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <h3>No attempts yet</h3>
          <p>
            Your interview attempts will appear here after
            you join an interview.
          </p>
        </div>
      );
    }

    return (
      <div className="interview-list">
        {items.map((attempt, index) => (
          <div
            className="interview-list-item"
            key={attempt.id || attempt.attemptId || index}
          >
            <div>
              <h3>
                {attempt.interview?.title ||
                  attempt.interviewTitle ||
                  "Interview"}
              </h3>

              <p>
                Status: {attempt.status || "Unknown"}
              </p>
            </div>

            <span
              className={`status-badge ${(
                attempt.status || "pending"
              ).toLowerCase()}`}
            >
              {attempt.status || "Pending"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="interview-layout">
      <InterviewSidebar
        role={role}
        activeItem={activeItem}
        onItemChange={handleNavigation}
        onCreateInterview={handleCreateInterview}
      />

      <main className="interview-main">
        <InterviewNavbar role={role} />

        <div className="interview-content">
          <div className="dashboard-toolbar">
            <div>
              <p className="page-eyebrow">VETTLY / WORKSPACE</p>
              <h2>Interview Dashboard</h2>
            </div>

            <RoleSwitcher
              role={role}
              onRoleChange={handleRoleChange}
            />
          </div>

          {loading ? (
            <div className="dashboard-message">
              Loading your interview dashboard...
            </div>
          ) : error ? (
            <div className="dashboard-error">
              <p>{error}</p>
              <button
                className="primary-btn"
                onClick={loadDashboardData}
              >
                Try Again
              </button>
            </div>
          ) : (
            role === "HOST"
              ? renderHostContent()
              : renderCandidateContent()
          )}
        </div>
      </main>
    </div>
  );
}

export default InterviewDashboard;
