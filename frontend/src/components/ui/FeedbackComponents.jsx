/**
 * Reusable UI feedback components for Acad Nexus.
 *
 * These lightweight, accessible primitives are used across the student
 * dashboard, professor workspace, and join-class workflow to give
 * consistent loading, error, empty-state, and confirmation experiences.
 */

/**
 * A simple spinner with a textual label.
 *
 * @param {{ message?: string }} props
 */
export function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div className="ui-loading" role="status" aria-live="polite">
      <span className="ui-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

/**
 * A styled error banner.
 *
 * @param {{ message: string, onRetry?: () => void }} props
 */
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="ui-error" role="alert">
      <span className="ui-error-icon" aria-hidden="true">⚠</span>
      <p>{message}</p>
      {onRetry && (
        <button className="text-button" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * A friendly empty-state placeholder with an icon, heading, and
 * optional description.
 *
 * @param {{ icon?: string, heading: string, description?: string }} props
 */
export function EmptyState({
  icon = "✦",
  heading,
  description,
  action,
}) {
  return (
    <div className="ui-empty" role="status">
      <div className="placeholder-icon" aria-hidden="true">{icon}</div>
      <h3>{heading}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: "16px" }}>{action}</div>}
    </div>
  );
}

/**
 * A confirmation dialog for destructive actions.
 *
 * @param {{
 *   open: boolean,
 *   title: string,
 *   message: string,
 *   confirmLabel?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="ui-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <div
        className="ui-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="ui-dialog-actions">
          <button
            className="ui-cancel-button"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>

          <button
            className="ui-danger-button"
            onClick={onConfirm}
            type="button"
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A success toast / inline message.
 *
 * @param {{ message: string }} props
 */
export function SuccessMessage({ message }) {
  if (!message) return null;

  return (
    <p className="ui-success" role="status">
      ✓ {message}
    </p>
  );
}
