import { useState, useEffect } from "react";

/**
 * ClassRosterModal displays the enrolled students for a specific course.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   classItem: object | null,
 * }} props
 */
export default function ClassRosterModal({ isOpen, onClose, classItem }) {
  const [search, setSearch] = useState("");
  const [copyEmailSuccess, setCopyEmailSuccess] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !classItem) return null;

  const rawStudents = classItem.students || [];
  // Normalized students (could be populated objects or ID strings)
  const students = rawStudents.map((s, idx) => {
    if (typeof s === "object" && s !== null) {
      return {
        id: s._id || s.id || `s-${idx}`,
        name: s.name || "Student",
        email: s.email || "No email available",
        joinedAt: s.createdAt,
      };
    }
    return {
      id: s,
      name: "Enrolled Student",
      email: `ID: ${String(s).slice(-6)}`,
      joinedAt: null,
    };
  });

  const filtered = students.filter((s) =>
    `${s.name} ${s.email}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  function handleCopyAllEmails() {
    const validEmails = students
      .map((s) => s.email)
      .filter((e) => e && e.includes("@"));

    if (validEmails.length === 0) return;

    const emailList = validEmails.join(", ");
    navigator.clipboard?.writeText(emailList);
    setCopyEmailSuccess(true);
    setTimeout(() => setCopyEmailSuccess(false), 2500);
  }

  return (
    <div className="prof-modal-backdrop" onClick={onClose}>
      <div
        className="prof-modal-card"
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roster-modal-title"
      >
        <div className="prof-modal-header">
          <div>
            <h2 id="roster-modal-title" style={{ margin: "0 0 4px" }}>
              Enrolled Students Roster
            </h2>
            <p className="prof-modal-subtitle">
              Course: <strong>{classItem.name}</strong> • Join Key: <code>{classItem.joinCode}</code>
            </p>
          </div>
          <button
            type="button"
            className="prof-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <input
            type="search"
            placeholder="Search students by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
            }}
          />

          {students.length > 0 && (
            <button
              type="button"
              className="prof-secondary-btn"
              onClick={handleCopyAllEmails}
              style={{ padding: "8px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
              title="Copy all student email addresses"
            >
              {copyEmailSuccess ? "✓ Copied!" : "📋 Copy Emails"}
            </button>
          )}
        </div>

        <div style={{ marginTop: "16px", maxHeight: "320px", overflowY: "auto" }}>
          {students.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                border: "2px dashed #e2e8f0",
                borderRadius: "12px",
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#334155" }}>
                No students enrolled yet
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Share your class join key <strong>{classItem.joinCode}</strong> with students to have them appear on this roster.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
              No students match "{search}".
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((s, idx) => (
                <div
                  key={s.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #f1f5f9",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#e0f2fe",
                        color: "#0284c7",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                        {s.name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        {s.email}
                      </p>
                    </div>
                  </div>

                  {s.joinedAt && (
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Enrolled {new Date(s.joinedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="prof-modal-footer" style={{ marginTop: "20px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Total Learners: <strong>{students.length}</strong>
          </span>
          <button type="button" className="prof-primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
