import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import ProfessorManagement from "./ProfessorManagement";
import { fetchAdminProfessors, fetchAdminStudents } from "../services/api";

export default function AdminDashboard() {
  const user = JSON.parse(
    localStorage.getItem("acadNexusUser") || "null"
  );
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [message] = useState("");
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("acadNexusToken");
    localStorage.removeItem("acadNexusUser");
    window.dispatchEvent(new Event("acadNexusAuthChanged"));
    navigate("/login", { replace: true });
  }

  const loadMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const [profRes, studRes] = await Promise.all([
        fetchAdminProfessors().catch(() => ({ data: { professors: [] } })),
        fetchAdminStudents().catch(() => ({ data: { students: [] } })),
      ]);
      setProfessors(profRes.data?.professors || []);
      setStudents(studRes.data?.students || []);
    } catch {
      // Graceful fallback to empty state
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const filteredStudents = students.filter((s) =>
    `${s.name} ${s.email}`.toLowerCase().includes(studentSearch.trim().toLowerCase())
  );

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">A</span>
          <span>Acad Nexus</span>
        </div>

        <p className="admin-nav-label">WORKSPACE</p>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === "Dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("Dashboard")}
        >
          <span>▦</span> Dashboard
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === "Professors" ? "active" : ""}`}
          onClick={() => setActiveTab("Professors")}
        >
          <span>♙</span> Professors
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === "Students" ? "active" : ""}`}
          onClick={() => setActiveTab("Students")}
        >
          <span>♧</span> Students
        </button>

        <div className="admin-sidebar-note">
          <strong>Admin workspace</strong>
          <br />
          Manage your academic platform, professors, and students.
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">ADMINISTRATION</p>
            <h1 className="admin-title">
              {activeTab === "Dashboard" && "Dashboard overview"}
              {activeTab === "Professors" && "Professor Management"}
              {activeTab === "Students" && "Student Directory"}
            </h1>
            <p className="admin-subtitle">
              {activeTab === "Dashboard" && "Manage your platform from one place."}
              {activeTab === "Professors" && "Create accounts and manage instructor access."}
              {activeTab === "Students" && "View registered students enrolled across classrooms."}
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

        {activeTab === "Dashboard" && (
          <>
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
                <p className="admin-stat-number">
                  {metricsLoading ? "…" : professors.length}
                </p>
                <span className="admin-stat-caption">
                  {metricsLoading
                    ? "Loading instructor count…"
                    : professors.length === 1
                    ? "1 registered instructor"
                    : `${professors.length} registered instructors`}
                </span>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>Total students</span>
                  <span className="admin-stat-icon">♧</span>
                </div>
                <p className="admin-stat-number">
                  {metricsLoading ? "…" : students.length}
                </p>
                <span className="admin-stat-caption">
                  {metricsLoading
                    ? "Loading student count…"
                    : students.length === 1
                    ? "1 registered student"
                    : `${students.length} registered students`}
                </span>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>Platform status</span>
                  <span className="admin-stat-icon">✓</span>
                </div>
                <p className="admin-stat-number">Active</p>
                <span className="admin-stat-caption">
                  Database and API services connected
                </span>
              </article>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <h2>Platform Management</h2>
                <span className="admin-status">ADMIN ACCESS</span>
              </div>

              <p className="admin-panel-description">
                Quickly navigate to instructor management or student rosters.
              </p>

              <div className="admin-action-row" style={{ marginBottom: "18px" }}>
                <div>
                  <h3>Manage professor accounts</h3>
                  <p>
                    Create instructor accounts with instant credentials.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => setActiveTab("Professors")}
                >
                  Manage Professors →
                </button>
              </div>

              <div className="admin-action-row">
                <div>
                  <h3>View student directory</h3>
                  <p>
                    Inspect enrolled students and account registration history.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  style={{ background: "#475569" }}
                  onClick={() => setActiveTab("Students")}
                >
                  View Students →
                </button>
              </div>

              {message && (
                <p className="admin-message" role="status">
                  {message}
                </p>
              )}
            </section>
          </>
        )}

        {activeTab === "Professors" && (
          <ProfessorManagement
            onBack={() => {
              setActiveTab("Dashboard");
              loadMetrics();
            }}
          />
        )}

        {activeTab === "Students" && (
          <section className="admin-table-card">
            <div className="admin-table-heading">
              <div>
                <h2>Registered Students</h2>
                <p>
                  {students.length} {students.length === 1 ? "student" : "students"} registered on Acad Nexus
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="search"
                  className="admin-search-input"
                  placeholder="Search students by name or email…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  aria-label="Search students"
                />

                <button
                  type="button"
                  className="admin-primary-button"
                  style={{ padding: "8px 14px", fontSize: "12px" }}
                  onClick={loadMetrics}
                  disabled={metricsLoading}
                >
                  {metricsLoading ? "Loading…" : "Refresh"}
                </button>
              </div>
            </div>

            {metricsLoading ? (
              <p style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                Loading students…
              </p>
            ) : filteredStudents.length === 0 ? (
              <p style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                {studentSearch
                  ? `No students match "${studentSearch}".`
                  : "No students registered yet."}
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registered Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.name}</strong>
                        </td>
                        <td>{student.email}</td>
                        <td>
                          <span className="admin-role-badge">Student</span>
                        </td>
                        <td>
                          {student.createdAt
                            ? new Date(student.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
