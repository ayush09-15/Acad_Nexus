
import { useEffect, useState } from "react";
import "./ProfessorManagement.css";

const API_URL = "http://localhost:5001/api/admin/professors";

export default function ProfessorManagement({ onBack }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProfessors() {
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
  }

  useEffect(() => {
    fetchProfessors();
  }, []);

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
            <p>Manage access for registered professors.</p>
          </div>

          <button
            className="pm-refresh-button"
            onClick={fetchProfessors}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && <p className="pm-error" role="alert">{error}</p>}

        {loading ? (
          <p className="pm-empty">Loading professor accounts...</p>
        ) : professors.length === 0 ? (
          <div className="pm-empty">
            <h3>No professors yet</h3>
            <p>Professor accounts will appear here after they are created.</p>
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
