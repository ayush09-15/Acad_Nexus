import { useState } from "react";

/**
 * ProfessorClassCard displays an individual class with its join code,
 * student enrollment count, subject pill, and management actions.
 *
 * @param {{
 *   classItem: object,
 *   onDelete: (classItem: object) => void,
 *   onEdit: (classItem: object) => void,
 * }} props
 */
export default function ProfessorClassCard({
  classItem,
  onDelete,
  onEdit,
  onViewDetails,
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopyCode() {
    if (!classItem.joinCode) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(classItem.joinCode);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = classItem.joinCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Graceful fallback
      setCopied(false);
    }
  }

  const studentCount = classItem.students?.length || 0;

  return (
    <article className="prof-class-card" aria-labelledby={`class-title-${classItem._id}`}>
      <div className="prof-card-top">
        <div className="course-icon" aria-hidden="true">
          {classItem.name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "CL"}
        </div>
        {classItem.subject && (
          <span className="prof-subject-pill">{classItem.subject}</span>
        )}
      </div>

      <h3 className="prof-card-name" id={`class-title-${classItem._id}`}>
        {classItem.name}
      </h3>

      {classItem.description ? (
        <p className="prof-card-desc">{classItem.description}</p>
      ) : (
        <p className="prof-card-desc" style={{ fontStyle: "italic" }}>
          No description provided.
        </p>
      )}

      {/* Class Key display */}
      <div className="prof-join-code-box">
        <div>
          <span className="prof-join-code-label">Class Key: </span>
          <span className="prof-join-code-value">{classItem.joinCode || "—"}</span>
        </div>
        <button
          type="button"
          className="prof-copy-btn"
          onClick={handleCopyCode}
          aria-label={`Copy join code ${classItem.joinCode}`}
          title="Share this code with your students"
        >
          {copied ? "✓ Copied!" : "Copy key"}
        </button>
      </div>

      <div className="prof-card-meta">
        <span>👥 {studentCount} {studentCount === 1 ? "student" : "students"}</span>

        <div className="prof-card-actions">
          {onViewDetails && (
            <button
              type="button"
              className="prof-secondary-btn"
              style={{ padding: "5px 10px", fontSize: "12px" }}
              onClick={() => onViewDetails(classItem)}
              title="View class details and shareable invitation"
            >
              Details
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              className="prof-secondary-btn"
              style={{ padding: "5px 10px", fontSize: "12px" }}
              onClick={() => onEdit(classItem)}
              title="Edit class information"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className="prof-danger-action"
              onClick={() => onDelete(classItem)}
              title="Delete this class"
              aria-label={`Delete class ${classItem.name}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
