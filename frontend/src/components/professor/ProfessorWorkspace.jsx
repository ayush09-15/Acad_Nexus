import { useEffect, useState } from "react";
import {
  fetchClasses,
  deleteClass as apiDeleteClass,
  getStoredUser,
  clearAuth,
} from "../../services/api";
import {
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  SuccessMessage,
  ConfirmDialog,
} from "../ui/FeedbackComponents";
import ProfessorClassCard from "./ProfessorClassCard";
import CreateClassModal from "./CreateClassModal";
import EditClassModal from "./EditClassModal";
import ClassDetailsModal from "./ClassDetailsModal";
import ClassMaterialsModal from "./ClassMaterialsModal";
import "./ProfessorWorkspace.css";
import "../ui/FeedbackComponents.css";

export default function ProfessorWorkspace() {
  const user = getStoredUser();
  const userId = user?.id || "";
  const userName = user?.name || "Professor";

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [infoNotice, setInfoNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal and dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailedClass, setDetailedClass] = useState(null);
  const [materialsClass, setMaterialsClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load classes owned by the authenticated professor
  async function loadClasses() {
    setLoading(true);
    setError("");

    try {
      const result = await fetchClasses();
      const all = result.data || [];

      // Filter classes that belong to this professor
      const myClasses = all.filter(
        (c) =>
          (userId && c.professorId === userId) ||
          c.professor === userName
      );

      setClasses(myClasses);
    } catch (err) {
      if (
        err.message?.includes("Authentication") ||
        err.message?.includes("token")
      ) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.message || "Failed to load your classes.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    let ignore = false;

    fetchClasses()
      .then((result) => {
        if (!ignore) {
          const all = result.data || [];
          const myClasses = all.filter(
            (c) =>
              (userId && c.professorId === userId) ||
              c.professor === userName
          );
          setClasses(myClasses);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load classes.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId, userName]);

  function handleLogout() {
    clearAuth();
    window.location.href = "/login";
  }

  function handleClassCreated(newClass) {
    setClasses((prev) => [newClass, ...prev]);
    setSuccessNotice(
      `Class "${newClass.name}" created! Join Key: ${newClass.joinCode}`
    );
    setTimeout(() => setSuccessNotice(""), 5000);
    loadClasses();
  }

  function promptDeleteClass(classItem) {
    setClassToDelete(classItem);
  }

  async function confirmDeleteClass() {
    if (!classToDelete) return;

    try {
      setDeleting(true);
      setError("");

      await apiDeleteClass(classToDelete._id);

      setClasses((prev) => prev.filter((c) => c._id !== classToDelete._id));
      setSuccessNotice(`Class "${classToDelete.name}" was successfully deleted.`);
      setTimeout(() => setSuccessNotice(""), 4000);
      setClassToDelete(null);
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete class. Please verify you own this class."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleEditClass(classItem) {
    setEditingClass(classItem);
  }

  function handleClassUpdated(updatedClass) {
    setClasses((prev) =>
      prev.map((c) => (c._id === updatedClass._id ? updatedClass : c))
    );
    setSuccessNotice(`Class "${updatedClass.name}" was successfully updated.`);
    setTimeout(() => setSuccessNotice(""), 4000);
  }

  // Filtered classes based on search
  const filteredClasses = classes.filter((c) =>
    `${c.name} ${c.subject || ""} ${c.joinCode || ""}`
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  // Compute workspace metrics
  const totalStudents = classes.reduce(
    (acc, c) => acc + (c.students?.length || 0),
    0
  );

  return (
    <div className="prof-shell">
      {/* Sidebar */}
      <aside className="prof-sidebar">
        <div className="prof-brand">
          <span>Acad Nexus</span>
          <span className="prof-brand-badge">PROFESSOR</span>
        </div>

        <nav className="prof-nav" aria-label="Professor Navigation">
          <p className="prof-nav-section-title">WORKSPACE</p>

          <button
            type="button"
            className={`prof-nav-item ${
              activeTab === "Dashboard" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("Dashboard");
              setInfoNotice("");
            }}
          >
            <span>▦</span> Dashboard Overview
          </button>

          <button
            type="button"
            className={`prof-nav-item ${
              activeTab === "Classes" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("Classes");
              setInfoNotice("");
            }}
          >
            <span>▤</span> My Classes ({classes.length})
          </button>

          <p className="prof-nav-section-title">MANAGEMENT</p>

          <button
            type="button"
            className="prof-nav-item"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span>＋</span> Create New Class
          </button>
        </nav>

        <div className="prof-sidebar-footer">
          <div className="prof-user-card">
            <div className="prof-user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="prof-user-details">
              <span className="prof-user-name">{userName}</span>
              <span className="prof-user-badge">Approved Professor</span>
            </div>
            <button
              type="button"
              className="logout-btn"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="prof-main">
        {/* Top bar */}
        <header className="prof-topbar">
          <div>
            <h1>
              {activeTab === "Dashboard"
                ? `Welcome back, ${userName.split(" ")[0]}`
                : "Manage Classes"}
            </h1>
            <p className="prof-topbar-subtitle">
              Manage your academic courses, join keys, and student rosters.
            </p>
          </div>

          <div className="prof-topbar-actions">
            <button
              type="button"
              className="prof-primary-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <span>＋</span> Create class
            </button>
          </div>
        </header>

        <div className="prof-content">
          {/* Feedback Notices */}
          {successNotice && <SuccessMessage message={successNotice} />}
          {infoNotice && (
            <div
              className="ui-error"
              style={{
                background: "#f0f9ff",
                borderColor: "#bae6fd",
                color: "#0369a1",
              }}
            >
              <span>ℹ</span>
              <p>{infoNotice}</p>
            </div>
          )}
          {error && <ErrorMessage message={error} onRetry={loadClasses} />}

          {/* Stats Cards */}
          <section className="prof-stats-grid" aria-label="Course summary statistics">
            <article className="prof-stat-card">
              <div className="prof-stat-top">
                <span className="prof-stat-title">Active Classes</span>
                <span className="prof-stat-icon">▤</span>
              </div>
              <p className="prof-stat-value">{classes.length}</p>
              <span className="prof-stat-caption">Courses under your instruction</span>
            </article>

            <article className="prof-stat-card">
              <div className="prof-stat-top">
                <span className="prof-stat-title">Enrolled Students</span>
                <span className="prof-stat-icon">👥</span>
              </div>
              <p className="prof-stat-value">{totalStudents}</p>
              <span className="prof-stat-caption">Total learners across all classes</span>
            </article>

            <article className="prof-stat-card">
              <div className="prof-stat-top">
                <span className="prof-stat-title">Platform Status</span>
                <span className="prof-stat-icon">✓</span>
              </div>
              <p className="prof-stat-value" style={{ fontSize: "20px" }}>
                Connected
              </p>
              <span className="prof-stat-caption">Live MongoDB Class Service</span>
            </article>
          </section>

          {/* Controls: Search and Title */}
          <div className="prof-controls">
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                Your Classes ({filteredClasses.length})
              </h2>
            </div>

            {classes.length > 0 && (
              <input
                type="search"
                className="prof-search-input"
                placeholder="Search classes by name, subject, or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search your classes"
              />
            )}
          </div>

          {/* Content States */}
          {loading && <LoadingSpinner message="Loading your classes…" />}

          {!loading && !error && classes.length === 0 && (
            <EmptyState
              icon="＋"
              heading="No classes yet"
              description="You have not created any classes yet. Click 'Create class' above to generate your first course and join key."
            />
          )}

          {!loading &&
            !error &&
            classes.length > 0 &&
            filteredClasses.length === 0 && (
              <EmptyState
                icon="⌕"
                heading="No matching classes"
                description={`No classes match "${searchQuery}". Check your spelling or clear the search.`}
              />
            )}

          {!loading && !error && filteredClasses.length > 0 && (
            <section className="prof-class-grid" aria-label="Class listing">
              {filteredClasses.map((item) => (
                <ProfessorClassCard
                  key={item._id}
                  classItem={item}
                  onDelete={promptDeleteClass}
                  onEdit={handleEditClass}
                  onViewDetails={(item) => setDetailedClass(item)}
                  onOpenMaterials={(item) => setMaterialsClass(item)}
                />
              ))}
            </section>
          )}
        </div>
      </main>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClassCreated={handleClassCreated}
      />

      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={Boolean(editingClass)}
        classItem={editingClass}
        onClose={() => setEditingClass(null)}
        onClassUpdated={handleClassUpdated}
      />

      {/* Class Details & Invitation Modal */}
      <ClassDetailsModal
        isOpen={Boolean(detailedClass)}
        classItem={detailedClass}
        onClose={() => setDetailedClass(null)}
      />

      {/* Study Materials & RAG Knowledge Base Modal */}
      <ClassMaterialsModal
        isOpen={Boolean(materialsClass)}
        classItem={materialsClass}
        onClose={() => setMaterialsClass(null)}
      />

      {/* Confirmation Dialog for Destructive Actions */}
      <ConfirmDialog
        open={Boolean(classToDelete)}
        title="Delete Class"
        message={`Are you sure you want to delete "${classToDelete?.name}"? All student connections to this class will be removed. This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete class"}
        onConfirm={confirmDeleteClass}
        onCancel={() => setClassToDelete(null)}
      />
    </div>
  );
}
