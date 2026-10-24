import { useState } from "react";
import { joinClassByCode } from "../services/api";
import { SuccessMessage, ErrorMessage } from "./ui/FeedbackComponents";

/**
 * JoinClassSection provides an accessible, validated form for joining
 * a class via a professor's join key.
 *
 * @param {{
 *   onClassJoined: (classData: object) => void,
 *   enrolledClasses?: Array<object>,
 *   variant?: "panel" | "page",
 * }} props
 */
export default function JoinClassSection({
  onClassJoined,
  enrolledClasses = [],
  variant = "panel",
}) {
  const [classKey, setClassKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);

  /**
   * Validate the input key before firing network request.
   */
  function validateKey(key) {
    const trimmed = key.trim();
    if (!trimmed) {
      return "Class key cannot be empty.";
    }
    if (trimmed.length < 4) {
      return "Class key must be at least 4 characters.";
    }
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      return "Class key can only contain letters and numbers.";
    }
    return "";
  }

  function handleInputChange(e) {
    const value = e.target.value.toUpperCase();
    setClassKey(value);

    // Clear validation error when user begins correcting it
    if (validationError) {
      setValidationError("");
    }
    if (apiError) {
      setApiError("");
    }
    if (successInfo) {
      setSuccessInfo(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedKey = classKey.trim().toUpperCase();
    const errorMsg = validateKey(trimmedKey);

    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    // Check if the student already enrolled in this class locally
    const alreadyJoined = enrolledClasses.some(
      (c) =>
        (c.joinCode && c.joinCode.toUpperCase() === trimmedKey) ||
        c._id === trimmedKey
    );

    if (alreadyJoined) {
      setValidationError("You are already enrolled in this class.");
      return;
    }

    try {
      setLoading(true);
      setValidationError("");
      setApiError("");
      setSuccessInfo(null);

      const result = await joinClassByCode(trimmedKey);
      const joinedCourse = result.data;

      // Double-check if the returned course ID is already enrolled
      const duplicateById = enrolledClasses.some(
        (c) => c._id === joinedCourse._id
      );

      if (duplicateById) {
        setValidationError(`You have already joined "${joinedCourse.name}".`);
        return;
      }

      setSuccessInfo(joinedCourse);
      setClassKey("");

      if (typeof onClassJoined === "function") {
        onClassJoined(joinedCourse);
      }
    } catch (err) {
      if (
        err.message?.includes("Invalid") ||
        err.message?.includes("not found")
      ) {
        setApiError(
          "Invalid class key. Please verify the code with your professor."
        );
      } else {
        setApiError(err.message || "Unable to join class. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const isPage = variant === "page";

  return (
    <section
      className={`panel ${isPage ? "placeholder-panel" : "join-panel"}`}
      aria-labelledby="join-class-heading"
    >
      <div className={isPage ? "placeholder-icon" : "panel-icon"} aria-hidden="true">
        ＋
      </div>

      {isPage && <p className="eyebrow">JOIN YOUR CLASS</p>}
      <h2 id="join-class-heading">Join a class</h2>

      <p>
        Ask your professor for the 8-character class key to enroll and start
        asking questions.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="join-class-input">Class key</label>

        <input
          id="join-class-input"
          type="text"
          value={classKey}
          onChange={handleInputChange}
          placeholder="e.g. A3F9B2C1"
          maxLength={16}
          disabled={loading}
          autoComplete="off"
          aria-invalid={Boolean(validationError || apiError)}
          aria-describedby={
            validationError
              ? "join-validation-error"
              : apiError
              ? "join-api-error"
              : "join-hint"
          }
        />

        <p id="join-hint" className="visually-hidden">
          Enter the class key provided by your professor.
        </p>

        {validationError && (
          <p
            id="join-validation-error"
            className="form-message form-message--error"
            role="alert"
          >
            {validationError}
          </p>
        )}

        {apiError && (
          <div id="join-api-error">
            <ErrorMessage
              message={apiError}
              onRetry={() => handleSubmit(new Event("submit"))}
            />
          </div>
        )}

        {successInfo && (
          <SuccessMessage
            message={`Successfully joined "${successInfo.name}" (${
              successInfo.subject || "Course"
            })! Your class list has been updated.`}
          />
        )}

        <button
          className="primary-button full-width"
          type="submit"
          disabled={loading || !classKey.trim()}
          aria-busy={loading}
        >
          {loading ? "Joining class…" : "Join class"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
}
