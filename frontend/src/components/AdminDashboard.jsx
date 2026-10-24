import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import ProfessorManagement from "./ProfessorManagement";

export default function AdminDashboard() {
  const user = JSON.parse(
    localStorage.getItem("acadNexusUser") || "null"
  );
  const [showProfessorManagement, setShowProfessorManagement] = useState(false);

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("acadNexusToken");
    localStorage.removeItem("acadNexusUser");
    window.dispatchEvent(new Event("acadNexusAuthChanged"));
    navigate("/login", { replace: true });
  }
  if (showProfessorManagement) {
  return (
    <ProfessorManagement
      onBack={() => setShowProfessorManagement(false)}
    />
  );
}

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">A</span>
          <span>Acad Nexus</span>
        </div>

        <p className="admin-nav-label">WORKSPACE</p>

        <div className="admin-nav-item active">
          <span>▦</span> Dashboard
        </div>

        <div className="admin-nav-item">
          <span>♙</span> Professors
        </div>

        <div className="admin-nav-item">
          <span>♧</span> Students
        </div>

        <div className="admin-sidebar-note">
          <strong>Admin workspace</strong>
          <br />
          Manage your academic platform and professor access.
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">ADMINISTRATION</p>
            <h1 className="admin-title">Dashboard overview</h1>
            <p className="admin-subtitle">
              Manage your platform from one place.
            </p>
          </div>

          <div className="admin-user-area">
            <div className="admin-avatar">
              {(user?.name || "Admin").charAt(0).toUpperCase()}
            </div>

            <div>
              <span className="admin-user-name">
                {user?.name || "Admin"}
              </span>
              <span className="admin-user-role">Administrator</span>
            </div>

            <button className="admin-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="admin-welcome">
          <h2>Welcome back, {(user?.name || "Admin").split(" ")[0]}!</h2>
          <p>
            Here's your Acad Nexus control center. Manage professors and
            keep your academic community organized.
          </p>
        </section>

        <section className="admin-stats">
          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span>Total professors</span>
              <span className="admin-stat-icon">♙</span>
            </div>
            <p className="admin-stat-number">—</p>
            <span className="admin-stat-caption">
              Connect professor management to view totals
            </span>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span>Pending approvals</span>
              <span className="admin-stat-icon">◷</span>
            </div>
            <p className="admin-stat-number">—</p>
            <span className="admin-stat-caption">
              Awaiting professor API integration
            </span>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span>Platform status</span>
              <span className="admin-stat-icon">✓</span>
            </div>
            <p className="admin-stat-number">Active</p>
            <span className="admin-stat-caption">
              Admin workspace is available
            </span>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Professor management</h2>
            <span className="admin-status">ADMIN ACCESS</span>
          </div>

          <p className="admin-panel-description">
            Create professor accounts and approve them before they can
            access professor features.
          </p>

          <div className="admin-action-row">
            <div>
              <h3>Manage professor accounts</h3>
              <p>
                Create accounts, review approval status, and manage
                professor access.
              </p>
            </div>

            <button
  className="admin-primary-button"
  onClick={() => setShowProfessorManagement(true)}
>
  Manage Professors →
</button>
          </div>

          {message && (
            <p className="admin-message" role="status">
              {message}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
