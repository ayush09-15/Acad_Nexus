import { useState } from "react";
import { LoadingSpinner, EmptyState, ErrorMessage } from "../ui/FeedbackComponents";
import "./Announcements.css";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDueDate(dueDateString) {
  if (!dueDateString) return null;
  const dueDate = new Date(dueDateString);
  if (isNaN(dueDate.getTime())) return null;

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  const formattedDate = dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const isOverdue = diffMs < 0;

  let countdown = "";
  if (isOverdue) {
    countdown = "Overdue";
  } else if (diffHours < 24) {
    countdown = diffHours <= 1 ? "Due in 1 hour" : `Due in ${diffHours}h`;
  } else if (diffDays === 1) {
    countdown = "Due tomorrow";
  } else {
    countdown = `Due in ${diffDays} days`;
  }

  return {
    formattedDate,
    countdown,
    isOverdue,
  };
}

export default function AnnouncementsFeed({
  announcements = [],
  loading = false,
  error = "",
  onRefresh,
  isProfessor = false,
  onDelete,
  onTogglePin,
  onOpenCreateModal,
  currentClass = null,
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.classId?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const categoryCounts = {
    all: announcements.length,
    announcement: announcements.filter((a) => a.category === "announcement").length,
    assignment: announcements.filter((a) => a.category === "assignment").length,
    exam: announcements.filter((a) => a.category === "exam").length,
    reminder: announcements.filter((a) => a.category === "reminder").length,
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "assignment":
        return "📝 Assignment";
      case "exam":
        return "⏰ Exam Alert";
      case "reminder":
        return "🔔 Reminder";
      default:
        return "📢 Notice";
    }
  };

  return (
    <div className="announcements-container">
      {/* Header Row */}
      <div className="announcements-header-row">
        <div className="announcements-title-group">
          <h3>
            {currentClass
              ? `${currentClass.name} — Notices & Deadlines`
              : "Classroom Notices & Upcoming Deadlines"}
          </h3>
          <p>
            {currentClass
              ? "Official announcements, assignment deadlines, and exam schedules posted by your instructor."
              : "Updates and alerts from all your active courses in one unified feed."}
          </p>
        </div>

        <div className="announcements-actions">
          {onRefresh && (
            <button
              type="button"
              className="filter-pill"
              onClick={onRefresh}
              title="Refresh feed"
            >
              🔄 Refresh
            </button>
          )}

          {isProfessor && onOpenCreateModal && (
            <button
              type="button"
              className="filter-pill active"
              onClick={onOpenCreateModal}
              style={{ padding: "8px 16px" }}
            >
              ＋ Post Notice
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="announcements-filters">
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "all" ? "active" : ""}`}
          onClick={() => setCategoryFilter("all")}
        >
          All ({categoryCounts.all})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "announcement" ? "active" : ""}`}
          onClick={() => setCategoryFilter("announcement")}
        >
          📢 Notices ({categoryCounts.announcement})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "assignment" ? "active" : ""}`}
          onClick={() => setCategoryFilter("assignment")}
        >
          📝 Assignments ({categoryCounts.assignment})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "exam" ? "active" : ""}`}
          onClick={() => setCategoryFilter("exam")}
        >
          ⏰ Exams ({categoryCounts.exam})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "reminder" ? "active" : ""}`}
          onClick={() => setCategoryFilter("reminder")}
        >
          🔔 Reminders ({categoryCounts.reminder})
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="Loading notices & deadlines…" />}
      {error && <ErrorMessage message={error} onRetry={onRefresh} />}

      {/* Empty State */}
      {!loading && !error && filteredAnnouncements.length === 0 && (
        <EmptyState
          icon="📢"
          heading={
            categoryFilter !== "all"
              ? `No ${categoryFilter} notices found`
              : "No announcements yet"
          }
          description={
            isProfessor
              ? "Publish your first announcement, homework deadline, or exam alert above."
              : "Your course instructors have not posted any announcements or deadlines yet."
          }
        />
      )}

      {/* Announcement Cards List */}
      {!loading && !error && filteredAnnouncements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredAnnouncements.map((item) => {
            const classInfo = item.classId;
            const className =
              typeof classInfo === "object" && classInfo?.name
                ? classInfo.name
                : currentClass?.name || "";
            const dueInfo = formatDueDate(item.dueDate);

            return (
              <article
                key={item._id}
                className={`announcement-card ${item.isPinned ? "is-pinned" : ""} ${
                  item.priority === "urgent" ? "is-urgent" : ""
                }`}
              >
                {/* Meta Row: Badges & Timestamp */}
                <div className="announcement-meta-row">
                  <div className="announcement-badges">
                    {item.isPinned && (
                      <span className="badge badge-pinned">📌 Pinned</span>
                    )}

                    <span
                      className={`badge badge-category-${item.category || "announcement"}`}
                    >
                      {getCategoryLabel(item.category)}
                    </span>

                    {item.priority === "urgent" && (
                      <span className="badge badge-urgent">⚡ Urgent</span>
                    )}

                    {className && (
                      <span className="badge badge-class-name">
                        📚 {className}
                      </span>
                    )}

                    {dueInfo && (
                      <span
                        className={`badge badge-due-date ${
                          dueInfo.isOverdue ? "overdue" : ""
                        }`}
                        title={dueInfo.formattedDate}
                      >
                        📅 {dueInfo.countdown} ({dueInfo.formattedDate})
                      </span>
                    )}
                  </div>

                  <span className="announcement-timestamp">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="announcement-title">{item.title}</h4>

                {/* Content */}
                <p className="announcement-content">{item.content}</p>

                {/* Footer: Author & Actions */}
                <div className="announcement-footer">
                  <span className="announcement-author">
                    Posted by <strong>Prof. {item.authorName?.replace(/^Prof\.\s*/i, "")}</strong>
                  </span>

                  {isProfessor && (
                    <div className="announcement-admin-actions">
                      {onTogglePin && (
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() =>
                            onTogglePin(
                              item.classId?._id || item.classId || currentClass?._id,
                              item._id
                            )
                          }
                          title={item.isPinned ? "Unpin notice" : "Pin notice to top"}
                        >
                          {item.isPinned ? "Unpin 📌" : "Pin 📌"}
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          className="btn-icon-action danger"
                          onClick={() =>
                            onDelete(
                              item.classId?._id || item.classId || currentClass?._id,
                              item._id
                            )
                          }
                          title="Delete notice"
                        >
                          Delete ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
