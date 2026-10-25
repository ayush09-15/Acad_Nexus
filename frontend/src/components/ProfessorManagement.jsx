import { useEffect, useState, useCallback } from "react";
import "./ProfessorManagement.css";

const API_URL = "http://localhost:5001/api/admin/professors";

export default function ProfessorManagement({ onBack }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add Professor Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("acadNexusToken");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch professors.");
      }

      setProfessors(data.data?.professors || []);
    } catch (err) {
      setError(err.message || "Unable to load professors.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Async load on mount to prevent cascading renders
  useEffect(() => {
    let ignore = false;
    const token = localStorage.getItem("acadNexusToken");

    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data.success) {
            setProfessors(data.data?.professors || []);
          } else {
            setError(data.message || "Failed to fetch professors.");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Unable to load professors.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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

      const token = localStorage.getItem("acadNexusToken");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create professor account.");
      }

      setFormSuccess(`Account created for ${newName}! The professor is approved and ready to log in.`);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      await fetchProfessors();
    } catch (err) {
      setFormError(err.message || "Unable to create professor account.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleApprove(professorId) {
    const token = localStorage.getItem("acadNexusToken");

    try {
      const response = await fetch(
        `${API_URL}/${professorId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve professor.");
      }

      await fetchProfessors();
    } catch (err) {
      setError(err.message || "Unable to approve professor.");
    }
  }

  return (
    <main className="professor-management">
      <header className="professor-management-header">
        <div>
          <p className="pm-eyebrow">ADMINISTRATION</p>
          <h1>Professor Management</h1>
          <p>Review professor accounts and manage platform access.</p>
        </div>

        <button className="pm-back-button" onClick={onBack}>
          ← Dashboard
        </button>
      </header>

      <section className="pm-summary">
        <div>
          <span>Total professors</span>
          <strong>{professors.length}</strong>
        </div>
        <div>
          <span>Pending approvals</span>
          <strong>
            {professors.filter((p) => !p.professorApproved).length}
          </strong>
        </div>
        <div>
          <span>Approved</span>
          <strong>
            {professors.filter((p) => p.professorApproved).length}
          </strong>
        </div>
      </section>

      <section className="pm-table-card">
        <div className="pm-table-heading">
          <div>
            <h2>Professor accounts</h2>
            <p>Create and manage access for registered professors.</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="pm-add-button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError("");
                setFormSuccess("");
              }}
            >
              {showAddForm ? "✕ Cancel" : "＋ Add Professor"}
            </button>
            <button
              type="button"
              className="pm-refresh-button"
              onClick={fetchProfessors}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Add Professor Form */}
        {showAddForm && (
          <form className="pm-add-form" onSubmit={handleCreateProfessor}>
            <h3>Add New Professor</h3>
            <p>Create credentials for an instructor account. The account is approved immediately upon creation.</p>

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
                <label htmlFor="prof-email">Email Address</label>
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
                <label htmlFor="prof-password">Password (min 8 characters)</label>
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
                {formSubmitting ? "Creating..." : "Create Professor Account"}
              </button>
            </div>
          </form>
        )}

        {formSuccess && <p className="pm-success" role="status">✓ {formSuccess}</p>}
        {error && <p className="pm-error" role="alert">{error}</p>}

        {loading ? (
          <p className="pm-empty">Loading professor accounts...</p>
        ) : professors.length === 0 ? (
          <div className="pm-empty">
            <h3>No professors yet</h3>
            <p>Click "＋ Add Professor" above to create an instructor account.</p>
          </div>
        ) : (
          <div className="pm-table-scroll">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Email</th>
                  <th>Approval</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {professors.map((professor) => (
                  <tr key={professor.id}>
                    <td>{professor.name}</td>
                    <td>{professor.email}</td>
                    <td>
                      <span
                        className={
                          professor.professorApproved
                            ? "pm-status approved"
                            : "pm-status pending"
                        }
                      >
                        {professor.professorApproved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td>
                      {professor.professorApproved ? (
                        <span className="pm-complete">Access granted</span>
                      ) : (
                        <button
                          className="pm-approve-button"
                          onClick={() => handleApprove(professor.id)}
                        >
                          Approve
                        </button>
                      )}
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
