
import { useAuth } from "../../../context/AuthContext.jsx";

function InterviewNavbar({ role, onRoleChange }) {
  const { user } = useAuth();

  const userName =
    user?.name ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header className="interview-navbar">
      <div>
        <p className="navbar-breadcrumb">Workspace / Interview</p>
        <h3>Interview Workspace</h3>
      </div>

      <div className="navbar-right">
        <span className="navbar-mode">
          {role === "HOST" ? "Host Mode" : "Candidate Mode"}
        </span>

        <div className="navbar-user">
          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{userName}</strong>
            <p>Vettly Member</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default InterviewNavbar;
