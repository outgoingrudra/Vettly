
function RoleSwitcher({ role, onRoleChange }) {
  return (
    <div className="role-switcher">
      <button
        type="button"
        className={`role-option ${role === "HOST" ? "active" : ""}`}
        onClick={() => onRoleChange("HOST")}
      >
        Host
      </button>

      <button
        type="button"
        className={`role-option ${role === "CANDIDATE" ? "active" : ""}`}
        onClick={() => onRoleChange("CANDIDATE")}
      >
        Candidate
      </button>
    </div>
  );
}

export default RoleSwitcher;
