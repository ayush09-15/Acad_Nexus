import { useEffect, useState, useCallback } from "react";
import {
  fetchClasses,
  deleteClass as apiDeleteClass,
  fetchClassMaterials,
  uploadClassMaterial,
  deleteClassMaterial,
  getMaterialDownloadUrl,
  askClassAssistant,
  fetchProfessorProfile,
  updateProfessorProfile,
  fetchAnnouncementsFeed,
  deleteClassAnnouncement,
  togglePinAnnouncement,
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
import ClassRosterModal from "./ClassRosterModal";
import AnnouncementsFeed from "../announcements/AnnouncementsFeed";
import CreateAnnouncementModal from "../announcements/CreateAnnouncementModal";
import ChatMessageContent from "../ChatMessageContent";
import "./ProfessorWorkspace.css";
import "../ui/FeedbackComponents.css";

export default function ProfessorWorkspace() {
  const user = getStoredUser();
  const userId = user?.id || "";
  const userName = user?.name || "Professor";

  // Navigation tab: 'Dashboard' | 'Classes' | 'Materials' | 'Students' | 'AI Assistant' | 'Profile'
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Academic Profile State
  const [profile, setProfile] = useState(user?.professorProfile || null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    department: user?.professorProfile?.department || "",
    designation: user?.professorProfile?.designation || "",
    qualification: user?.professorProfile?.qualification || "",
    institution: user?.professorProfile?.institution || "",
    cabinOffice: user?.professorProfile?.cabinOffice || "",
    officeHours: user?.professorProfile?.officeHours || "",
    bio: user?.professorProfile?.bio || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Modals and dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailedClass, setDetailedClass] = useState(null);
  const [materialsClass, setMaterialsClass] = useState(null);
  const [rosterClass, setRosterClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Centralized Materials Tab State
  const [allMaterials, setAllMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [quickUploadClassId, setQuickUploadClassId] = useState("");
  const [quickUploadFile, setQuickUploadFile] = useState(null);
  const [quickUploadTitle, setQuickUploadTitle] = useState("");
  const [quickUploading, setQuickUploading] = useState(false);

  // AI Assistant Testing Playground State
  const [aiClassId, setAiClassId] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Classroom Announcements & Deadlines State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementInitialClassId, setAnnouncementInitialClassId] = useState("");

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await fetchAnnouncementsFeed();
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Error loading announcements:", err.message);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  const handleAnnouncementCreated = (newAnn) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    setSuccessNotice("Announcement published successfully!");
  };

  const handleDeleteAnnouncement = async (classId, announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteClassAnnouncement(classId, announcementId);
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
      setSuccessNotice("Announcement deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete announcement.");
    }
  };

  const handleTogglePinAnnouncement = async (classId, announcementId) => {
    try {
      const res = await togglePinAnnouncement(classId, announcementId);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === announcementId ? res.data : a))
      );
      setSuccessNotice(res.message || "Announcement pin updated.");
    } catch (err) {
      setError(err.message || "Failed to update pin status.");
    }
  };

  // Load classes owned by the authenticated professor
  const loadClasses = useCallback(async () => {
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
      if (myClasses.length > 0 && !aiClassId) {
        setAiClassId(myClasses[0]._id);
      }
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
  }, [userId, userName, aiClassId]);

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
          if (myClasses.length > 0) {
            setAiClassId(myClasses[0]._id);
            setQuickUploadClassId(myClasses[0]._id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load classes.");
          setLoading(false);
        }
      });

    loadAnnouncements();

    return () => {
      ignore = true;
    };
  }, [userId, userName, loadAnnouncements]);

  // Reload announcements when navigating to the Announcements tab
  useEffect(() => {
    if (activeTab === "Announcements") {
      loadAnnouncements();
    }
  }, [activeTab, loadAnnouncements]);

  // Load all materials when Materials tab is selected
  const loadAllMaterials = useCallback(async () => {
    if (classes.length === 0) {
      setAllMaterials([]);
      return;
    }
    try {
      setMaterialsLoading(true);
      const promises = classes.map(async (c) => {
        try {
          const res = await fetchClassMaterials(c._id);
          const mats = res.data || [];
          return mats.map((m) => ({ ...m, className: c.name }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(promises);
      setAllMaterials(results.flat());
    } finally {
      setMaterialsLoading(false);
    }
  }, [classes]);

  useEffect(() => {
    if (activeTab === "Materials") {
      loadAllMaterials();
    }
  }, [activeTab, loadAllMaterials]);

  // Load professor's academic profile
  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await fetchProfessorProfile();
      const p = res.data?.profile || res.data;
      if (p && typeof p === "object") {
        setProfile(p);
        setProfileForm({
          department: p.department || "",
          designation: p.designation || "",
          qualification: p.qualification || "",
          institution: p.institution || "",
          cabinOffice: p.cabinOffice || "",
          officeHours: p.officeHours || "",
          bio: p.bio || "",
        });
      }
    } catch (err) {
      console.warn("Could not load professor profile:", err.message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setError("");
      const res = await updateProfessorProfile(profileForm);
      const p = res.data?.profile || res.data;
      if (p && typeof p === "object") {
        setProfile(p);
        setProfileForm({
          department: p.department || "",
          designation: p.designation || "",
          qualification: p.qualification || "",
          institution: p.institution || "",
          cabinOffice: p.cabinOffice || "",
          officeHours: p.officeHours || "",
          bio: p.bio || "",
        });

        // Keep local user session in sync with updated profile fields
        try {
          const stored = JSON.parse(localStorage.getItem("acadNexusUser") || "{}");
          const updated = {
            ...stored,
            department: p.department || stored.department,
            designation: p.designation || stored.designation,
            qualification: p.qualification || stored.qualification,
            institution: p.institution || stored.institution,
          };
          localStorage.setItem("acadNexusUser", JSON.stringify(updated));
          window.dispatchEvent(new Event("acadNexusAuthChanged"));
        } catch {
          // ignore localStorage JSON error
        }
      }
      setIsEditingProfile(false);
      setSuccessNotice("Academic profile updated successfully.");
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update academic profile.");
    } finally {
      setProfileSaving(false);
    }
  }

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

  function handleClassUpdated(updatedClass) {
    setClasses((prev) =>
      prev.map((c) => (c._id === updatedClass._id ? updatedClass : c))
    );
    setSuccessNotice(`Class "${updatedClass.name}" was successfully updated.`);
    setTimeout(() => setSuccessNotice(""), 4000);
  }

  async function handleQuickUpload(e) {
    e.preventDefault();
    if (!quickUploadClassId || !quickUploadFile) {
      setError("Please select a course and choose a PDF file.");
      return;
    }

    try {
      setQuickUploading(true);
      setError("");
      const res = await uploadClassMaterial(
        quickUploadClassId,
        quickUploadFile,
        quickUploadTitle.trim()
      );
      setSuccessNotice(`"${res.data.title}" was uploaded and queued for RAG indexing.`);
      setTimeout(() => setSuccessNotice(""), 4000);
      setQuickUploadFile(null);
      setQuickUploadTitle("");
      const fileInput = document.getElementById("prof-quick-upload-file");
      if (fileInput) fileInput.value = "";
      loadAllMaterials();
    } catch (err) {
      setError(err.message || "Failed to upload study material.");
    } finally {
      setQuickUploading(false);
    }
  }

  async function handleDeleteMaterial(mat) {
    const ok = window.confirm(`Delete "${mat.title}"? This will remove its vectors from the AI index.`);
    if (!ok) return;

    try {
      await deleteClassMaterial(mat._id);
      setAllMaterials((prev) => prev.filter((m) => m._id !== mat._id));
      setSuccessNotice(`"${mat.title}" was deleted.`);
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete material.");
    }
  }

  async function handleSendAiTestQuestion(e) {
    e.preventDefault();
    const q = aiQuestion.trim();
    if (!q || !aiClassId || aiLoading) return;

    const userMsg = { id: Date.now(), role: "user", text: q };
    const loadingMsg = { id: Date.now() + 1, role: "assistant", text: "Analyzing documents...", loading: true };

    setAiMessages((prev) => [...prev, userMsg, loadingMsg]);
    setAiQuestion("");
    setAiLoading(true);

    try {
      const res = await askClassAssistant(aiClassId, q);
      const answer = res.data?.answer || "No response received.";
      const citations = res.data?.citations || [];

      setAiMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsg.id
            ? { ...msg, text: answer, citations, loading: false }
            : msg
        )
      );
    } catch (err) {
      setAiMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsg.id
            ? {
                ...msg,
                text: `Assistant error: ${err.message || "Unable to reach AI service."}`,
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setAiLoading(false);
    }
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

  // Gather all enrolled students across all classes
  const allStudentsList = classes.flatMap((c) => {
    return (c.students || []).map((s, idx) => {
      if (typeof s === "object" && s !== null) {
        return {
          id: `${c._id}-${s._id || idx}`,
          name: s.name || "Student",
          email: s.email || "No email",
          className: c.name,
          classJoinCode: c.joinCode,
          joinedAt: s.createdAt,
        };
      }
      return {
        id: `${c._id}-${s}-${idx}`,
        name: "Enrolled Student",
        email: `ID: ${String(s).slice(-6)}`,
        className: c.name,
        classJoinCode: c.joinCode,
        joinedAt: null,
      };
    });
  });

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
            className={`prof-nav-item ${activeTab === "Dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("Dashboard")}
          >
            <span>▦</span> Dashboard Overview
          </button>

          <button
            type="button"
            className={`prof-nav-item ${activeTab === "Classes" ? "active" : ""}`}
            onClick={() => setActiveTab("Classes")}
          >
            <span>▤</span> My Classes ({classes.length})
          </button>

          <button
            type="button"
            className={`prof-nav-item ${activeTab === "Materials" ? "active" : ""}`}
            onClick={() => setActiveTab("Materials")}
          >
            <span>📄</span> Course Materials
          </button>

          <button
            type="button"
            className={`prof-nav-item ${activeTab === "Students" ? "active" : ""}`}
            onClick={() => setActiveTab("Students")}
          >
            <span>👥</span> Student Rosters ({totalStudents})
          </button>

          <button
            type="button"
            className={`prof-nav-item ${activeTab === "Announcements" ? "active" : ""}`}
            onClick={() => setActiveTab("Announcements")}
          >
            <span>📢</span> Announcements ({announcements.length})
          </button>

          <button
            type="button"
            className={`prof-nav-item ${activeTab === "AI Assistant" ? "active" : ""}`}
            onClick={() => setActiveTab("AI Assistant")}
          >
            <span>✦</span> AI Assistant Test
          </button>

          <button
            type="button"
            className={`prof-nav-item ${activeTab === "Profile" ? "active" : ""}`}
            onClick={() => setActiveTab("Profile")}
          >
            <span>👤</span> Academic Profile
          </button>

          <p className="prof-nav-section-title">ACTIONS</p>

          <button
            type="button"
            className="prof-nav-item"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span>＋</span> Create New Class
          </button>
        </nav>

        <div className="prof-sidebar-footer">
          <div
            className="prof-user-card"
            onClick={() => setActiveTab("Profile")}
            style={{ cursor: "pointer" }}
            title="View Academic Profile"
          >
            <div className="prof-user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="prof-user-details">
              <span className="prof-user-name">{userName}</span>
              <span className="prof-user-badge">
                {profile?.designation || user?.professorProfile?.designation || "Faculty Instructor"}
              </span>
            </div>
            <button
              type="button"
              className="logout-btn"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="prof-main">
        {/* Top bar */}
        <header className="prof-topbar">
          <div>
            <h1>
              {activeTab === "Dashboard" && `Welcome back, ${userName}`}
              {activeTab === "Classes" && "My Course Classrooms"}
              {activeTab === "Materials" && "All Course Study Materials"}
              {activeTab === "Students" && "Student Directory & Rosters"}
              {activeTab === "Announcements" && "Class Announcements & Deadlines"}
              {activeTab === "AI Assistant" && "Interactive AI Teaching Assistant Preview"}
              {activeTab === "Profile" && "Academic & Faculty Profile"}
            </h1>
            <p className="prof-topbar-subtitle">
              {activeTab === "Dashboard" && "Manage your academic courses, join keys, and student rosters."}
              {activeTab === "Classes" && "Create, edit, and organize classrooms and invitation codes."}
              {activeTab === "Materials" && "Manage PDF documents indexed for Document-Grounded RAG."}
              {activeTab === "Students" && "Inspect enrolled students across all your active courses."}
              {activeTab === "Announcements" && "Publish notices, assignment deadlines, exam alerts, and pinned announcements to your students."}
              {activeTab === "AI Assistant" && "Test student queries and verified document citations before lecture."}
              {activeTab === "Profile" && "Manage your academic department, credentials, office hours, and faculty bio."}
            </p>
          </div>

          <div className="prof-topbar-actions">
            {activeTab === "Profile" ? (
              <button
                type="button"
                className="prof-secondary-btn"
                onClick={() => setIsEditingProfile((prev) => !prev)}
              >
                {isEditingProfile ? "✕ Cancel Editing" : "✎ Edit Profile"}
              </button>
            ) : activeTab === "Announcements" ? (
              <button
                type="button"
                className="prof-primary-btn"
                onClick={() => {
                  setAnnouncementInitialClassId("");
                  setIsAnnouncementModalOpen(true);
                }}
              >
                <span>＋</span> Post Notice
              </button>
            ) : (
              <button
                type="button"
                className="prof-primary-btn"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <span>＋</span> Create class
              </button>
            )}
          </div>
        </header>

        <div className="prof-content">
          {successNotice && <SuccessMessage message={successNotice} />}
          {error && <ErrorMessage message={error} onRetry={loadClasses} />}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "Dashboard" && (
            <>
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
                  <span className="prof-stat-caption">Total learners across all courses</span>
                </article>

                <article className="prof-stat-card">
                  <div className="prof-stat-top">
                    <span className="prof-stat-title">AI Assistant</span>
                    <span className="prof-stat-icon">✦</span>
                  </div>
                  <p className="prof-stat-value" style={{ fontSize: "20px" }}>
                    RAG Ready
                  </p>
                  <span className="prof-stat-caption">Document citations enabled</span>
                </article>

                <article
                  className="prof-stat-card"
                  onClick={() => setActiveTab("Announcements")}
                  style={{ cursor: "pointer" }}
                  title="View Announcements & Deadlines"
                >
                  <div className="prof-stat-top">
                    <span className="prof-stat-title">Class Notices</span>
                    <span className="prof-stat-icon">📢</span>
                  </div>
                  <p className="prof-stat-value">{announcements.length}</p>
                  <span className="prof-stat-caption">Posted updates & deadlines</span>
                </article>

                <article className="prof-stat-card">
                  <div className="prof-stat-top">
                    <span className="prof-stat-title">Platform Status</span>
                    <span className="prof-stat-icon">✓</span>
                  </div>
                  <p className="prof-stat-value" style={{ fontSize: "20px" }}>
                    Online
                  </p>
                  <span className="prof-stat-caption">MongoDB & Vector Index live</span>
                </article>
              </section>

              {/* Class search and list */}
              <div className="prof-controls">
                <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Your Classes ({filteredClasses.length})
                </h2>

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

              {loading && <LoadingSpinner message="Loading your classes…" />}

              {!loading && !error && classes.length === 0 && (
                <EmptyState
                  icon="＋"
                  heading="No classes yet"
                  description="You have not created any classes yet. Click 'Create class' above to generate your first course and join key."
                />
              )}

              {!loading && !error && filteredClasses.length > 0 && (
                <section className="prof-class-grid" aria-label="Class listing">
                  {filteredClasses.map((item) => (
                    <ProfessorClassCard
                      key={item._id}
                      classItem={item}
                      onDelete={(c) => setClassToDelete(c)}
                      onEdit={(c) => setEditingClass(c)}
                      onViewDetails={(c) => setDetailedClass(c)}
                      onOpenMaterials={(c) => setMaterialsClass(c)}
                      onViewRoster={(c) => setRosterClass(c)}
                      onPostNotice={(c) => {
                        setAnnouncementInitialClassId(c._id);
                        setIsAnnouncementModalOpen(true);
                      }}
                    />
                  ))}
                </section>
              )}
            </>
          )}

          {/* TAB 2: MY CLASSES */}
          {activeTab === "Classes" && (
            <>
              <div className="prof-controls">
                <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Classroom Management
                </h2>
                <input
                  type="search"
                  className="prof-search-input"
                  placeholder="Filter courses…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {!loading && filteredClasses.length > 0 && (
                <section className="prof-class-grid">
                  {filteredClasses.map((item) => (
                    <ProfessorClassCard
                      key={item._id}
                      classItem={item}
                      onDelete={(c) => setClassToDelete(c)}
                      onEdit={(c) => setEditingClass(c)}
                      onViewDetails={(c) => setDetailedClass(c)}
                      onOpenMaterials={(c) => setMaterialsClass(c)}
                      onViewRoster={(c) => setRosterClass(c)}
                      onPostNotice={(c) => {
                        setAnnouncementInitialClassId(c._id);
                        setIsAnnouncementModalOpen(true);
                      }}
                    />
                  ))}
                </section>
              )}
            </>
          )}

          {/* TAB 3: COURSE MATERIALS */}
          {activeTab === "Materials" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Quick Upload Section */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>
                  Upload Course Material (PDF)
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                  Upload lecture notes, textbooks, or problem sets. They are automatically chunked and indexed into Pinecone for the AI assistant.
                </p>

                <form
                  onSubmit={handleQuickUpload}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: "12px",
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Select Class
                    </label>
                    <select
                      value={quickUploadClassId}
                      onChange={(e) => setQuickUploadClassId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                      }}
                      required
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.joinCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Document Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Unit 3 - Memory Management"
                      value={quickUploadTitle}
                      onChange={(e) => setQuickUploadTitle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      PDF File (.pdf, max 25MB)
                    </label>
                    <input
                      id="prof-quick-upload-file"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setQuickUploadFile(e.target.files?.[0] || null)}
                      style={{ fontSize: "12px" }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="prof-primary-btn"
                    disabled={quickUploading || !quickUploadFile}
                    style={{ height: "38px" }}
                  >
                    {quickUploading ? "Uploading & Vectorizing…" : "Upload PDF"}
                  </button>
                </form>
              </div>

              {/* All Uploaded Materials List */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                    Indexed Course Materials ({allMaterials.length})
                  </h3>
                  <button
                    type="button"
                    onClick={loadAllMaterials}
                    className="prof-secondary-btn"
                    style={{ fontSize: "12px" }}
                  >
                    ↻ Refresh
                  </button>
                </div>

                {materialsLoading ? (
                  <LoadingSpinner message="Loading course study materials…" />
                ) : allMaterials.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
                    No materials uploaded yet. Use the upload form above to add your first syllabus or lecture PDF.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {allMaterials.map((mat) => (
                      <div
                        key={mat._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          background: "#f8fafc",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "20px" }}>📄</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                              {mat.title}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                              Course: <strong>{mat.className}</strong> • {mat.chunkCount || 0} text chunks indexed • {new Date(mat.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            className="rag-badge rag-badge--indexed"
                            style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: "#dcfce7", color: "#166534" }}
                          >
                            ● RAG Indexed
                          </span>

                          <a
                            href={getMaterialDownloadUrl(mat._id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="prof-secondary-btn"
                            style={{ padding: "5px 10px", fontSize: "12px", textDecoration: "none" }}
                          >
                            Download
                          </a>

                          <button
                            type="button"
                            className="prof-danger-action"
                            style={{ padding: "5px 10px", fontSize: "12px" }}
                            onClick={() => handleDeleteMaterial(mat)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STUDENT DIRECTORY */}
          {activeTab === "Students" && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a" }}>
                    Enrolled Students Across All Courses ({allStudentsList.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Learners currently joined in any of your active classes.
                  </p>
                </div>
              </div>

              {allStudentsList.length === 0 ? (
                <EmptyState
                  icon="👥"
                  heading="No enrolled students yet"
                  description="Share your class join keys with your students so they can enroll in your courses."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {allStudentsList.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "#e0f2fe",
                            color: "#0284c7",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontSize: "13px",
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

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: "4px" }}>
                          {s.className}
                        </span>
                        {s.joinedAt && (
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                            Joined {new Date(s.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI TEACHING ASSISTANT PLAYGROUND */}
          {activeTab === "AI Assistant" && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "24px",
              }}
            >
              <div style={{ marginBottom: "18px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a" }}>
                  Interactive AI Assistant Playground
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Test student queries against your course documents. The assistant retrieves relevant chunks and generates answers with exact page citations.
                </p>
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  icon="✦"
                  heading="Create a class first"
                  description="You need at least one class and an uploaded PDF material to test the AI assistant."
                />
              ) : (
                <>
                  <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Target Course:
                    </label>
                    <select
                      value={aiClassId}
                      onChange={(e) => setAiClassId(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.joinCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conversation Window */}
                  <div
                    style={{
                      height: "360px",
                      overflowY: "auto",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {aiMessages.length === 0 ? (
                      <div style={{ textAlign: "center", margin: "auto", color: "#64748b" }}>
                        <span style={{ fontSize: "28px" }}>✦</span>
                        <p style={{ margin: "8px 0 0", fontWeight: 600 }}>
                          Ask any question about the selected course materials.
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                          Example: "Summarize the key concepts" or "Explain the main algorithm"
                        </p>
                      </div>
                    ) : (
                      aiMessages.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "80%",
                            background: m.role === "user" ? "#0ea5e9" : "#ffffff",
                            color: m.role === "user" ? "#ffffff" : "#1e293b",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              fontSize: "11px",
                              fontWeight: 800,
                              marginBottom: "4px",
                              color: m.role === "user" ? "#e0f2fe" : "#0284c7",
                            }}
                          >
                            {m.role === "user" ? "You (Professor)" : "Acad Nexus AI"}
                          </span>

                          {m.role === "user" ? (
                            <p style={{ margin: 0, fontSize: "14px", whiteSpace: "pre-wrap" }}>
                              {m.text}
                            </p>
                          ) : (
                            <ChatMessageContent text={m.text} />
                          )}

                          {m.citations && m.citations.length > 0 && (
                            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                                Verified Document Citations:
                              </span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                                {m.citations.map((cite, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      background: "#f1f5f9",
                                      fontSize: "11px",
                                      color: "#334155",
                                      fontWeight: 600,
                                      border: "1px solid #cbd5e1",
                                    }}
                                  >
                                    📄 {cite.document_title} • Page {cite.page_number}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={handleSendAiTestQuestion}
                    style={{ marginTop: "12px", display: "flex", gap: "10px" }}
                  >
                    <input
                      type="text"
                      placeholder="Type a test question for the course AI assistant…"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      disabled={aiLoading}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                      }}
                    />
                    <button
                      type="submit"
                      className="prof-primary-btn"
                      disabled={!aiQuestion.trim() || aiLoading}
                    >
                      {aiLoading ? "Thinking…" : "Send Question →"}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* TAB: CLASSROOM ANNOUNCEMENTS & DEADLINES */}
          {activeTab === "Announcements" && (
            <div
              className="prof-card"
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <AnnouncementsFeed
                announcements={announcements}
                loading={announcementsLoading}
                onRefresh={loadAnnouncements}
                isProfessor={true}
                onDelete={handleDeleteAnnouncement}
                onTogglePin={handleTogglePinAnnouncement}
                onOpenCreateModal={() => {
                  setAnnouncementInitialClassId("");
                  setIsAnnouncementModalOpen(true);
                }}
              />
            </div>
          )}

          {/* TAB 5: ACADEMIC PROFILE */}
          {activeTab === "Profile" && (
            <div className="prof-profile-card">
              <div className="prof-profile-header">
                <div className="prof-profile-avatar-row">
                  <div className="prof-profile-big-avatar">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="prof-profile-identity">
                    <h2>{userName}</h2>
                    <p>{user?.email}</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      <span className="prof-profile-pill">
                        🎓 {profile?.designation || "Faculty Instructor"}
                      </span>
                      <span className="prof-profile-pill" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        ✓ {profile?.approvalStatus === "approved" ? "Verified Faculty" : "Active Instructor"}
                      </span>
                      <span className="prof-profile-pill" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
                        🏛️ {profile?.institution || "Acad Nexus University"}
                      </span>
                    </div>
                  </div>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    className="prof-primary-btn"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    ✎ Edit Academic Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ marginTop: "24px" }}>
                  <div className="prof-profile-grid">
                    <div className="prof-profile-field-group">
                      <label htmlFor="edit-dept">Department</label>
                      <input
                        id="edit-dept"
                        className="prof-profile-input"
                        type="text"
                        placeholder="e.g. Computer Science & Engineering"
                        value={profileForm.department}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, department: e.target.value })
                        }
                      />
                    </div>

                    <div className="prof-profile-field-group">
                      <label htmlFor="edit-desig">Designation / Title</label>
                      <input
                        id="edit-desig"
                        className="prof-profile-input"
                        type="text"
                        placeholder="e.g. Associate Professor, HOD, Lecturer"
                        value={profileForm.designation}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, designation: e.target.value })
                        }
                      />
                    </div>

                    <div className="prof-profile-field-group">
                      <label htmlFor="edit-qual">Qualification</label>
                      <input
                        id="edit-qual"
                        className="prof-profile-input"
                        type="text"
                        placeholder="e.g. Ph.D. in Artificial Intelligence, M.Tech"
                        value={profileForm.qualification}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, qualification: e.target.value })
                        }
                      />
                    </div>

                    <div className="prof-profile-field-group">
                      <label htmlFor="edit-inst">Institution / University</label>
                      <input
                        id="edit-inst"
                        className="prof-profile-input"
                        type="text"
                        placeholder="e.g. Acad Nexus Institute of Technology"
                        value={profileForm.institution}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, institution: e.target.value })
                        }
                      />
                    </div>

                    <div className="prof-profile-field-group">
                      <label htmlFor="edit-cabin">Cabin / Office Location</label>
                      <input
                        id="edit-cabin"
                        className="prof-profile-input"
                        type="text"
                        placeholder="e.g. Academic Block 3, Room 402"
                        value={profileForm.cabinOffice}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, cabinOffice: e.target.value })
                        }
                      />
                    </div>

                    <div className="prof-profile-field-group">
                      <label htmlFor="edit-hours">Office Consultation Hours</label>
                      <input
                        id="edit-hours"
                        className="prof-profile-input"
                        type="text"
                        placeholder="e.g. Mon & Wed 2:00 PM - 4:00 PM"
                        value={profileForm.officeHours}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, officeHours: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="prof-profile-field-group" style={{ marginTop: "20px" }}>
                    <label htmlFor="edit-bio">Academic Bio & Research Interests</label>
                    <textarea
                      id="edit-bio"
                      className="prof-profile-input prof-profile-textarea"
                      placeholder="Share your academic background, areas of research, and teaching focus..."
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button
                      type="submit"
                      className="prof-primary-btn"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving changes…" : "✓ Save Profile Changes"}
                    </button>
                    <button
                      type="button"
                      className="prof-secondary-btn"
                      onClick={() => setIsEditingProfile(false)}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="prof-profile-grid">
                  <div className="prof-profile-field-group">
                    <label>Department</label>
                    <div className="prof-profile-value">
                      {profile?.department || "General Academics"}
                    </div>
                  </div>

                  <div className="prof-profile-field-group">
                    <label>Designation / Title</label>
                    <div className="prof-profile-value">
                      {profile?.designation || "Faculty Instructor"}
                    </div>
                  </div>

                  <div className="prof-profile-field-group">
                    <label>Qualification</label>
                    <div className="prof-profile-value">
                      {profile?.qualification || "Not specified"}
                    </div>
                  </div>

                  <div className="prof-profile-field-group">
                    <label>Institution</label>
                    <div className="prof-profile-value">
                      {profile?.institution || "Acad Nexus University"}
                    </div>
                  </div>

                  <div className="prof-profile-field-group">
                    <label>Cabin / Office Location</label>
                    <div className="prof-profile-value">
                      {profile?.cabinOffice || "Not specified"}
                    </div>
                  </div>

                  <div className="prof-profile-field-group">
                    <label>Office Hours</label>
                    <div className="prof-profile-value">
                      {profile?.officeHours || "By appointment"}
                    </div>
                  </div>

                  <div className="prof-profile-field-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Academic Bio & Teaching Interests</label>
                    <div className="prof-profile-value" style={{ minHeight: "80px", whiteSpace: "pre-line" }}>
                      {profile?.bio || "No academic biography provided yet. Click 'Edit Academic Profile' to add your research interests and course overview."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClassCreated={handleClassCreated}
      />

      <EditClassModal
        isOpen={Boolean(editingClass)}
        classItem={editingClass}
        onClose={() => setEditingClass(null)}
        onClassUpdated={handleClassUpdated}
      />

      <ClassDetailsModal
        isOpen={Boolean(detailedClass)}
        classItem={detailedClass}
        onClose={() => setDetailedClass(null)}
      />

      <ClassMaterialsModal
        isOpen={Boolean(materialsClass)}
        classItem={materialsClass}
        onClose={() => setMaterialsClass(null)}
      />

      <ClassRosterModal
        isOpen={Boolean(rosterClass)}
        classItem={rosterClass}
        onClose={() => setRosterClass(null)}
      />

      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onAnnouncementCreated={handleAnnouncementCreated}
        classes={classes}
        initialClassId={announcementInitialClassId}
      />

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
