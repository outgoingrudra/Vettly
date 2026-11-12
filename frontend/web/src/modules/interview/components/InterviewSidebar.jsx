
function InterviewSidebar({
  role,
  activeItem,
  onItemChange,
  onCreateInterview,
}) {
  const hostMenu = [
    "Overview",
    "My Interviews",
    "Drafts",
    "Published",
    "Archived",
  ];

  const candidateMenu = [
    "Overview",
    "Invitations",
    "My Attempts",
    "My Results",
  ];

  const menuItems =
    role === "HOST" ? hostMenu : candidateMenu;

  return (
    <aside className="interview-sidebar">
      <div className="interview-brand">
        <h2>Vettly<span>.</span></h2>
        <p>Interview Platform</p>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`sidebar-link ${
                activeItem === item ? "active" : ""
              }`}
              onClick={() => onItemChange(item)}
            >
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </div>

      {role === "HOST" && (
        <button
          type="button"
          className="sidebar-create-btn"
          onClick={onCreateInterview}
        >
          + Create Interview
        </button>
      )}

      <div className="sidebar-footer">
        <p>Vettly Interview Module</p>
        <span>Practice. Connect. Grow.</span>
      </div>
    </aside>
  );
}

export default InterviewSidebar;
