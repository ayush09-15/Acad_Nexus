import { useState } from "react";
import { createClass } from "../../services/api";
import { ErrorMessage } from "../ui/FeedbackComponents";

/**
 * CreateClassModal provides an accessible modal dialog for professors
 * to create a new class.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onClassCreated: (newClass: object) => void,
 * }} props
 */
export default function CreateClassModal({ isOpen, onClose, onClassCreated }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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

      const result = await createClass({
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
      });

      const created = result.data;
      if (typeof onClassCreated === "function") {
        onClassCreated(created);
      }

      // Reset form
      setName("");
      setSubject("");
      setDescription("");
      onClose();
    } catch (err) {
      setApiError(
        err.message || "Failed to create class. Please try again."
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
      aria-labelledby="create-class-modal-title"
      onClick={onClose}
    >
      <div
        className="prof-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prof-modal-header">
          <h2 id="create-class-modal-title">Create a new class</h2>
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
            <label htmlFor="modal-class-name">
              Class name <span aria-hidden="true">*</span>
            </label>
            <input
              id="modal-class-name"
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
              aria-describedby={validationError ? "modal-name-error" : undefined}
            />
            {validationError && (
              <p
                id="modal-name-error"
                className="form-message form-message--error"
                role="alert"
              >
                {validationError}
              </p>
            )}
          </div>

          <div className="prof-form-group">
            <label htmlFor="modal-class-subject">Subject or department</label>
            <input
              id="modal-class-subject"
              type="text"
              placeholder="e.g. Computer Science & Engineering"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="prof-form-group">
            <label htmlFor="modal-class-description">Description</label>
            <textarea
              id="modal-class-description"
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
              {submitting ? "Creating class…" : "Create class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
