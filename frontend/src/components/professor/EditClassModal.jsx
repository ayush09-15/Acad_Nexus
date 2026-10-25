import { useState, useEffect } from "react";
import { updateClass } from "../../services/api";
import { ErrorMessage } from "../ui/FeedbackComponents";

/**
 * EditClassModal provides an accessible dialog for professors
 * to edit an existing class's name, subject, and description.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   classItem: object | null,
 *   onClassUpdated: (updatedClass: object) => void,
 * }} props
 */
export default function EditClassModal({
  isOpen,
  onClose,
  classItem,
  onClassUpdated,
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync state whenever the selected classItem changes or modal opens
  useEffect(() => {
    if (classItem) {
      setName(classItem.name || "");
      setSubject(classItem.subject || "");
      setDescription(classItem.description || "");
      setValidationError("");
      setApiError("");
    }
  }, [classItem, isOpen]);

  // Handle Escape key to close dialog
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !classItem) return null;

  function validate() {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Class name is required.";
    }
    if (trimmed.length < 3) {
      return "Class name must be at least 3 characters long.";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      setSubmitting(true);
      setValidationError("");
      setApiError("");

      const result = await updateClass(classItem._id, {
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
      });

      const updated = result.data;
      if (typeof onClassUpdated === "function") {
        onClassUpdated(updated);
      }

      onClose();
    } catch (err) {
      setApiError(
        err.message || "Failed to update class. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="prof-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-class-modal-title"
      onClick={onClose}
    >
      <div
        className="prof-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prof-modal-header">
          <h2 id="edit-class-modal-title">Edit Class</h2>
          <button
            type="button"
            className="prof-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="prof-form-group">
            <label htmlFor="edit-modal-class-name">
              Class name <span aria-hidden="true">*</span>
            </label>
            <input
              id="edit-modal-class-name"
              type="text"
              placeholder="e.g. Distributed Operating Systems"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError("");
              }}
              disabled={submitting}
              autoFocus
              aria-invalid={Boolean(validationError)}
              aria-describedby={
                validationError ? "edit-modal-name-error" : undefined
              }
            />
            {validationError && (
              <p
                id="edit-modal-name-error"
                className="form-message form-message--error"
                role="alert"
              >
                {validationError}
              </p>
            )}
          </div>

          <div className="prof-form-group">
            <label htmlFor="edit-modal-class-subject">
              Subject or department
            </label>
            <input
              id="edit-modal-class-subject"
              type="text"
              placeholder="e.g. Computer Science & Engineering"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="prof-form-group">
            <label htmlFor="edit-modal-class-description">Description</label>
            <textarea
              id="edit-modal-class-description"
              placeholder="Optional overview or syllabus details for your students…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          {apiError && (
            <ErrorMessage
              message={apiError}
              onRetry={handleSubmit}
            />
          )}

          <div className="prof-modal-footer">
            <button
              type="button"
              className="prof-secondary-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="prof-primary-btn"
              disabled={submitting || !name.trim()}
              aria-busy={submitting}
            >
              {submitting ? "Saving changes…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
