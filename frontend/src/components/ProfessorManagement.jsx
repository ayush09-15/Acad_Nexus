import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminProfessors,
  approveAdminProfessor,
  revokeAdminProfessor,
  deleteAdminProfessor,
  createAdminProfessor,
} from "../services/api";
import "./ProfessorManagement.css";

export default function ProfessorManagement({ onBack }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'approved'

  // Add Professor Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchAdminProfessors();
      setProfessors(res.data?.professors || []);
    } catch (err) {
      setError(err.message || "Unable to load professors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  async function handleCreateProfessor(e) {
    e.preventDefault();

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setFormError("All fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");
      setFormSuccess("");

      await createAdminProfessor({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        department: newDepartment.trim() || undefined,
        designation: newDesignation.trim() || undefined,
      });

      setFormSuccess(
        `Account created for ${newName}! The professor is approved and ready to log in.`
      );
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewDepartment("");
      setNewDesignation("");
      setShowAddForm(false);
      await fetchProfessors();
    } catch (err) {
      setFormError(err.message || "Unable to create professor account.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleApprove(professorId) {
    try {
      setActionLoadingId(professorId);
      setError("");
      await approveAdminProfessor(professorId);
      setProfessors((prev) =>
        prev.map((p) =>
          p.id === professorId ? { ...p, professorApproved: true } : p
        )
      );
      setFormSuccess("Professor access granted successfully.");
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Unable to approve professor.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRevoke(professorId) {
    const ok = window.confirm(
      "Are you sure you want to revoke this professor's access? They will no longer be able to log in until re-approved."
    );
    if (!ok) return;

    try {
      setActionLoadingId(professorId);
      setError("");
      await revokeAdminProfessor(professorId);
      setProfessors((prev) =>
        prev.map((p) =>
          p.id === professorId ? { ...p, professorApproved: false } : p
        )
      );
      setFormSuccess("Professor access revoked.");
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Unable to revoke professor access.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(professor) {
    const ok = window.confirm(
      `Are you sure you want to remove the account for "${professor.name}"? This action cannot be undone.`
    );
    if (!ok) return;

    try {
      setActionLoadingId(professor.id);
      setError("");
      await deleteAdminProfessor(professor.id);
      setProfessors((prev) => prev.filter((p) => p.id !== professor.id));
      setFormSuccess(`Professor "${professor.name}" was removed.`);
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Unable to remove professor account.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const pendingCount = professors.filter((p) => !p.professorApproved).length;
  const approvedCount = professors.filter((p) => p.professorApproved).length;

  const filteredProfessors = professors.filter((p) => {
    if (filter === "pending") return !p.professorApproved;
    if (filter === "approved") return p.professorApproved;
    return true;
  });

  return (
    <main className="professor-management">
      <header className="professor-management-header">
        <div>
          <p className="pm-eyebrow">ADMINISTRATION</p>
          <h1>Professor Management & Approvals</h1>
          <p>
            Review registered instructors, approve access, or provision new faculty accounts.
          </p>
        </div>

        <button className="pm-back-button" onClick={onBack}>
          ← Dashboard
        </button>
      </header>

      {/* Summary KPI Cards */}
      <section className="pm-summary">
        <div>
          <span>Total professors</span>
          <strong>{professors.length}</strong>
        </div>
        <div style={{ borderColor: pendingCount > 0 ? "#fde68a" : undefined }}>
          <span style={{ color: pendingCount > 0 ? "#d97706" : undefined }}>
            Pending approvals
          </span>
          <strong style={{ color: pendingCount > 0 ? "#b45309" : undefined }}>
            {pendingCount}
          </strong>
        </div>
        <div>
          <span>Approved instructors</span>
          <strong style={{ color: "#16a34a" }}>{approvedCount}</strong>
        </div>
      </section>

      <section className="pm-table-card">
        <div className="pm-table-heading">
          <div>
            <h2>Instructor Accounts</h2>
            <p>Control which professors have authorization to create classrooms and upload materials.</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Filter buttons */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
              <button
                type="button"
                onClick={() => setFilter("all")}
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: filter === "all" ? "#fff" : "transparent",
                  color: filter === "all" ? "#0f172a" : "#64748b",
                  boxShadow: filter === "all" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                All ({professors.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("pending")}
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: filter === "pending" ? "#fff" : "transparent",
                  color: filter === "pending" ? "#d97706" : "#64748b",
                  boxShadow: filter === "pending" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("approved")}
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: filter === "approved" ? "#fff" : "transparent",
                  color: filter === "approved" ? "#16a34a" : "#64748b",
                  boxShadow: filter === "approved" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Approved ({approvedCount})
              </button>
            </div>

            <button
              type="button"
              className="pm-add-button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError("");
                setFormSuccess("");
              }}
            >
              {showAddForm ? "✕ Cancel" : "＋ Provision Professor"}
            </button>

            <button
              type="button"
              className="pm-refresh-button"
              onClick={fetchProfessors}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Add Professor Form */}
        {showAddForm && (
          <form className="pm-add-form" onSubmit={handleCreateProfessor}>
            <h3>Provision New Faculty Account</h3>
            <p>
              Directly create pre-approved credentials for an instructor account.
            </p>

            {formError && <p className="pm-error" role="alert">{formError}</p>}

            <div className="pm-form-grid">
              <div>
                <label htmlFor="prof-name">Full Name</label>
                <input
                  id="prof-name"
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={formSubmitting}
                  required
                />
              </div>
              <div>
                <label htmlFor="prof-email">Institutional Email</label>
                <input
                  id="prof-email"
                  type="email"
                  placeholder="e.g. jsmith@university.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={formSubmitting}
                  required
                />
              </div>
              <div>
                <label htmlFor="prof-dept">Department</label>
                <input
                  id="prof-dept"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  disabled={formSubmitting}
                />
              </div>
              <div>
                <label htmlFor="prof-desig">Designation</label>
                <input
                  id="prof-desig"
                  type="text"
                  placeholder="e.g. Assistant Professor"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  disabled={formSubmitting}
                />
              </div>
              <div>
                <label htmlFor="prof-password">Temporary Password (min 8 chars)</label>
                <input
                  id="prof-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={formSubmitting}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="pm-form-actions">
              <button
                type="submit"
                className="pm-submit-btn"
                disabled={formSubmitting}
              >
                {formSubmitting ? "Creating…" : "Create & Approve Professor"}
              </button>
            </div>
          </form>
        )}

        {formSuccess && <p className="pm-success" role="status">✓ {formSuccess}</p>}
        {error && <p className="pm-error" role="alert">{error}</p>}

        {loading ? (
          <p className="pm-empty">Loading professor accounts…</p>
        ) : filteredProfessors.length === 0 ? (
          <div className="pm-empty">
            <h3>No professors in this view</h3>
            <p>
              {filter === "pending"
                ? "No pending approvals! All registered professors have been reviewed."
                : "No professor accounts found."}
            </p>
          </div>
        ) : (
          <div className="pm-table-scroll">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Department & Designation</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th>Approval Status</th>
                  <th style={{ textAlign: "right" }}>Administrative Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfessors.map((professor) => (
                  <tr key={professor.id}>
                    <td>
                      <strong>{professor.name}</strong>
                      {professor.qualification && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          {professor.qualification}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                        {professor.designation || "Faculty Instructor"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {professor.department || "General Academics"}
                      </div>
                    </td>
                    <td>{professor.email}</td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {professor.createdAt
                          ? new Date(professor.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          professor.professorApproved
                            ? "pm-status approved"
                            : "pm-status pending"
                        }
                      >
                        {professor.professorApproved ? "● Approved" : "◐ Pending Approval"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        {!professor.professorApproved ? (
                          <button
                            type="button"
                            className="pm-approve-button"
                            onClick={() => handleApprove(professor.id)}
                            disabled={actionLoadingId === professor.id}
                            style={{
                              background: "#16a34a",
                              borderColor: "#15803d",
                              padding: "6px 12px",
                              fontSize: "12px",
                            }}
                          >
                            {actionLoadingId === professor.id ? "Approving…" : "✓ Approve Access"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevoke(professor.id)}
                            disabled={actionLoadingId === professor.id}
                            style={{
                              background: "transparent",
                              color: "#d97706",
                              border: "1px solid #fde68a",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            title="Revoke professor's platform access"
                          >
                            {actionLoadingId === professor.id ? "…" : "Revoke Access"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(professor)}
                          disabled={actionLoadingId === professor.id}
                          style={{
                            background: "transparent",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            padding: "5px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title="Permanently remove this professor account"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
