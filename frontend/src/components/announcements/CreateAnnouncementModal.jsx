import { useState, useEffect } from "react";
import { createClassAnnouncement } from "../../services/api";
import "./Announcements.css";

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  onAnnouncementCreated,
  classes = [],
  initialClassId = "",
}) {
  const [classId, setClassId] = useState(initialClassId || (classes[0]?._id || ""));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("announcement");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setClassId(initialClassId || (classes[0]?._id || ""));
      setTitle("");
      setContent("");
      setCategory("announcement");
      setPriority("normal");
      setIsPinned(false);
      setDueDate("");
      setError("");
    }
  }, [isOpen, initialClassId, classes]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId) {
      setError("Please select a target class.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an announcement title.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter the announcement details.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        isPinned,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      const res = await createClassAnnouncement(classId, payload);

      if (onAnnouncementCreated) {
        onAnnouncementCreated(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to post announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card"
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "560px",
          padding: "24px 28px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              📢 Publish Class Notice or Deadline
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Broadcast announcements, homework deadlines, or exam alerts to enrolled students.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              fontSize: "20px",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "13px",
              marginBottom: "16px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Target Class Dropdown */}
          <div className="announcement-form-group">
            <label htmlFor="ann-class">Target Classroom *</label>
            <select
              id="ann-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            >
              <option value="" disabled>Select a class…</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.joinCode})
                </option>
              ))}
            </select>
          </div>

          {/* Announcement Title */}
          <div className="announcement-form-group">
            <label htmlFor="ann-title">Title *</label>
            <input
              id="ann-title"
              type="text"
              placeholder="e.g. Assignment 2 Released / Midterm Exam Room Change"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="announcement-form-grid">
            <div className="announcement-form-group">
              <label htmlFor="ann-category">Category</label>
              <select
                id="ann-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="announcement">📢 General Notice</option>
                <option value="assignment">📝 Assignment</option>
                <option value="exam">⏰ Exam Alert</option>
                <option value="reminder">🔔 Reminder</option>
              </select>
            </div>

            <div className="announcement-form-group">
              <label htmlFor="ann-priority">Priority</label>
              <select
                id="ann-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">⚡ Urgent Alert</option>
              </select>
            </div>
          </div>

          {/* Optional Due Date */}
          <div className="announcement-form-group">
            <label htmlFor="ann-due-date">Due / Event Date (Optional)</label>
            <input
              id="ann-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <small style={{ color: "#64748b", fontSize: "11px" }}>
              Sets an interactive countdown badge for assignments or exam sessions.
            </small>
          </div>

          {/* Detailed Content */}
          <div className="announcement-form-group">
            <label htmlFor="ann-content">Notice Content / Instructions *</label>
            <textarea
              id="ann-content"
              rows={4}
              placeholder="Provide complete instructions, submission guidelines, or syllabus updates for your students…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Pin Checkbox */}
          <label className="announcement-checkbox-row">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
              📌 Pin this announcement to the top of the classroom feed
            </span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: 0,
                background: "#0ea5e9",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(14, 165, 233, 0.3)",
              }}
            >
              {loading ? "Publishing…" : "Publish Notice →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
