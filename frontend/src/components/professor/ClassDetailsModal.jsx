import { useState } from "react";

/**
 * ClassDetailsModal displays complete course details and provides
 * professors with ready-to-share invitation snippets for students.
 *
 * @param {{
 *   classItem: object | null,
 *   isOpen: boolean,
 *   onClose: () => void,
 * }} props
 */
export default function ClassDetailsModal({ classItem, isOpen, onClose }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen || !classItem) return null;

  const invitationText = `Join our class "${classItem.name}"${
    classItem.subject ? ` (${classItem.subject})` : ""
  } on Acad Nexus! Use class key: ${classItem.joinCode || "N/A"}`;

  async function handleCopyInvitation() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = invitationText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch {
      setCopiedSnippet(false);
    }
  }

  return (
    <div
      className="prof-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-details-title"
      onClick={onClose}
    >
      <div
        className="prof-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        <div className="prof-modal-header">
          <h2 id="class-details-title">Class Details & Invitation</h2>
          <button
            type="button"
            className="prof-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div>
          <div style={{ marginBottom: "16px" }}>
            <span className="prof-subject-pill" style={{ marginBottom: "8px" }}>
              {classItem.subject || "General Course"}
            </span>
            <h3 style={{ margin: "6px 0 4px", fontSize: "20px", color: "#0f172a" }}>
              {classItem.name}
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Instructor: Prof. {classItem.professor?.replace(/^Prof\.\s*/i, "")}
            </p>
          </div>

          {classItem.description && (
            <div style={{ marginBottom: "18px" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#334155",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "10px",
                }}
              >
                {classItem.description}
              </p>
            </div>
          )}

          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#0369a1",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Student Enrollment Key
              </span>
              <span style={{ fontSize: "12px", color: "#0284c7" }}>
                👥 {classItem.students?.length || 0} students enrolled
              </span>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "22px",
                fontWeight: 800,
                color: "#0284c7",
                letterSpacing: "2px",
              }}
            >
              {classItem.joinCode || "—"}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="invitation-snippet"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#475569",
                marginBottom: "6px",
              }}
            >
              Shareable Invitation Text
            </label>
            <textarea
              id="invitation-snippet"
              readOnly
              value={invitationText}
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "13px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#f8fafc",
                color: "#1e293b",
                resize: "none",
              }}
            />
          </div>

          <div className="prof-modal-footer">
            <button
              type="button"
              className="prof-secondary-btn"
              onClick={onClose}
            >
              Close
            </button>

            <button
              type="button"
              className="prof-primary-btn"
              onClick={handleCopyInvitation}
            >
              {copiedSnippet ? "✓ Copied snippet!" : "Copy invitation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
