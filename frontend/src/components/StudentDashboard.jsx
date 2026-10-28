import { useEffect, useState, useCallback } from "react";
import {
  fetchClasses,
  leaveClass as apiLeaveClass,
  askClassAssistant,
  fetchChatSessions,
  createChatSession,
  fetchSessionMessages,
  deleteChatSession,
  renameChatSession,
  fetchAnnouncementsFeed,
  fetchClassAnnouncements,
  getStoredUser,
  clearAuth,
} from "../services/api";
import {
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  ConfirmDialog,
  SuccessMessage,
} from "./ui/FeedbackComponents";
import JoinClassSection from "./JoinClassSection";
import ChatMessageContent from "./ChatMessageContent";
import AnnouncementsFeed from "./announcements/AnnouncementsFeed";
import "./announcements/Announcements.css";
import "../components/ui/FeedbackComponents.css";

// Temporary demo notes (unchanged from original).
const initialNotes = [
  {
    id: 1,
    title: "Normalization: 2NF vs 3NF",
    subject: "Database Management Systems",
  },
  {
    id: 2,
    title: "Transactions and ACID",
    subject: "Database Management Systems",
  },
];

function loadFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

export default function StudentDashboard() {
  const storedUser = getStoredUser();
  const userName = storedUser?.name || "Student";

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const [activePage, setActivePage] = useState("Dashboard");
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState("");
  const [dashboardNotice, setDashboardNotice] = useState("");
  const [classToLeave, setClassToLeave] = useState(null);
  const [leavingClass, setLeavingClass] = useState(false);
  const [notes] = useState(initialNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [chatMessages, setChatMessages] = useState(() =>
    loadFromStorage("acad-nexus-chat-messages", {})
  );
  const [chatInput, setChatInput] = useState("");
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Classroom Announcements & Deadlines State
  const [feedAnnouncements, setFeedAnnouncements] = useState([]);
  const [feedAnnouncementsLoading, setFeedAnnouncementsLoading] = useState(false);
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [classAnnouncementsLoading, setClassAnnouncementsLoading] = useState(false);
  const [classTab, setClassTab] = useState("chat"); // "chat" | "announcements"

  const loadFeedAnnouncements = useCallback(async () => {
    setFeedAnnouncementsLoading(true);
    try {
      const res = await fetchAnnouncementsFeed();
      setFeedAnnouncements(res.data || []);
    } catch (err) {
      console.warn("Could not load announcements feed:", err.message);
    } finally {
      setFeedAnnouncementsLoading(false);
    }
  }, []);

  const loadClassAnnouncements = useCallback(async (classId) => {
    if (!classId) return;
    setClassAnnouncementsLoading(true);
    try {
      const res = await fetchClassAnnouncements(classId);
      setClassAnnouncements(res.data || []);
    } catch (err) {
      console.warn("Could not load class announcements:", err.message);
    } finally {
      setClassAnnouncementsLoading(false);
    }
  }, []);

  // Load chat sessions & announcements whenever a class page is active
  useEffect(() => {
    const currentClass = classes.find((c) => c.name === activePage);
    const classId = currentClass?._id || currentClass?.id;
    if (!classId) return;

    let ignore = false;
    setSessionsLoading(true);
    setClassTab("chat");

    loadClassAnnouncements(classId);

    fetchChatSessions(classId)
      .then((res) => {
        if (ignore) return;
        const sessions = res.data || [];
        setChatSessions(sessions);

        if (sessions.length > 0) {
          const firstSession = sessions[0];
          setActiveSessionId(firstSession.id);
          setChatLoading(true);
          return fetchSessionMessages(classId, firstSession.id);
        } else {
          setActiveSessionId(null);
          setChatMessages((prev) => ({ ...prev, [activePage]: [] }));
          return null;
        }
      })
      .then((msgRes) => {
        if (ignore || !msgRes) return;
        if (msgRes.success && Array.isArray(msgRes.data)) {
          setChatMessages((prev) => ({
            ...prev,
            [activePage]: msgRes.data.map((msg) => ({
              id: msg.id || msg._id,
              role: msg.role,
              text: msg.text,
              citations: msg.citations || [],
              loading: false,
            })),
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not load chat sessions:", err.message);
      })
      .finally(() => {
        if (!ignore) {
          setSessionsLoading(false);
          setChatLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activePage, classes]);

  function handleNewChat() {
    setActiveSessionId(null);
    setChatMessages((prev) => ({ ...prev, [activePage]: [] }));
  }

  async function handleSelectSession(sessionId) {
    if (sessionId === activeSessionId) return;
    const currentClass = classes.find((c) => c.name === activePage);
    const classId = currentClass?._id || currentClass?.id;
    if (!classId) return;

    setActiveSessionId(sessionId);
    setChatLoading(true);
    try {
      const res = await fetchSessionMessages(classId, sessionId);
      if (res.success && Array.isArray(res.data)) {
        setChatMessages((prev) => ({
          ...prev,
          [activePage]: res.data.map((msg) => ({
            id: msg.id || msg._id,
            role: msg.role,
            text: msg.text,
            citations: msg.citations || [],
            loading: false,
          })),
        }));
      }
    } catch (err) {
      console.error("Failed to load session messages:", err.message);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleDeleteSession(e, sessionId) {
    e.stopPropagation();
    const currentClass = classes.find((c) => c.name === activePage);
    const classId = currentClass?._id || currentClass?.id;
    if (!classId) return;

    if (!window.confirm("Delete this conversation?")) return;

    try {
      await deleteChatSession(classId, sessionId);
      const remaining = chatSessions.filter((s) => s.id !== sessionId);
      setChatSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err.message);
    }
  }

  // Fetch classes from the backend on user action or retry.
  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    setClassesError("");

    try {
      const result = await fetchClasses();
      const fetchedClasses = result.data || [];
      setClasses(fetchedClasses);
    } catch (error) {
      if (error.message?.includes("Authentication") || error.message?.includes("token")) {
        setClassesError("Your session has expired. Please log in again.");
      } else {
        setClassesError(error.message || "Unable to load classes.");
      }
    } finally {
      setClassesLoading(false);
    }
  }, []);

  // Initial load on mount via async promise resolution to prevent cascading renders.
  useEffect(() => {
    let ignore = false;

    fetchClasses()
      .then((result) => {
        if (!ignore) {
          setClasses(result.data || []);
          setClassesLoading(false);
        }
      })
      .catch((error) => {
        if (!ignore) {
          if (error.message?.includes("Authentication") || error.message?.includes("token")) {
            setClassesError("Your session has expired. Please log in again.");
          } else {
            setClassesError(error.message || "Unable to load classes.");
          }
          setClassesLoading(false);
        }
      });

    loadFeedAnnouncements();

    return () => {
      ignore = true;
    };
  }, [loadFeedAnnouncements]);

  useEffect(() => {
    if (activePage === "Dashboard") {
      loadFeedAnnouncements();
    }
  }, [activePage, loadFeedAnnouncements]);

  // Callback when a student successfully enrolls in a class.
  function handleClassJoined(newClass) {
    setClasses((previousClasses) => {
      const exists = previousClasses.some((c) => c._id === newClass._id);
      if (exists) return previousClasses;
      return [newClass, ...previousClasses];
    });
    loadClasses();
    loadFeedAnnouncements();
  }

  // Navigate to a page and clear any previous message.
  function navigateTo(page) {
    setActivePage(page);
    setMessage("");
  }

  async function handleConfirmLeaveClass() {
    if (!classToLeave) return;

    try {
      setLeavingClass(true);
      await apiLeaveClass(classToLeave._id || classToLeave.id);
      setClasses((prev) =>
        prev.filter(
          (c) => (c._id || c.id) !== (classToLeave._id || classToLeave.id)
        )
      );
      setDashboardNotice(`You have left "${classToLeave.name}".`);
      setTimeout(() => setDashboardNotice(""), 4000);
      setClassToLeave(null);
    } catch (err) {
      setClassesError(err.message || "Failed to leave class. Please try again.");
    } finally {
      setLeavingClass(false);
    }
  }

  async function sendChatMessage(event) {
    event.preventDefault();

    const question = chatInput.trim();
    if (!question || isChatSubmitting) return;

    const currentClass = classes.find((c) => c.name === activePage);
    const classId = currentClass?._id || currentClass?.id;

    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    // Immediately render user's question and placeholder thinking message
    setChatMessages((previousMessages) => ({
      ...previousMessages,
      [activePage]: [
        ...(previousMessages[activePage] || []),
        {
          id: userMsgId,
          role: "user",
          text: question,
        },
        {
          id: assistantMsgId,
          role: "assistant",
          text: "Analyzing course study materials...",
          loading: true,
          citations: [],
        },
      ],
    }));

    setChatInput("");
    setIsChatSubmitting(true);

    try {
      if (!classId) {
        throw new Error("Classroom reference not found. Please re-open the class.");
      }

      const response = await askClassAssistant(classId, question, activeSessionId);
      const { answer, citations, sessionId: resSessionId, sessionTitle } = response.data;

      // If this was a new conversation, record activeSessionId and add to sessions list
      if (!activeSessionId && resSessionId) {
        setActiveSessionId(resSessionId);
        setChatSessions((prev) => [
          { id: resSessionId, title: sessionTitle || question, lastMessageAt: new Date() },
          ...prev.filter((s) => s.id !== resSessionId),
        ]);
      } else if (activeSessionId) {
        setChatSessions((prev) => {
          const curr = prev.find((s) => s.id === activeSessionId);
          const others = prev.filter((s) => s.id !== activeSessionId);
          return [
            { ...(curr || { id: activeSessionId, title: sessionTitle || question }), lastMessageAt: new Date() },
            ...others,
          ];
        });
      }

      setChatMessages((previousMessages) => ({
        ...previousMessages,
        [activePage]: (previousMessages[activePage] || []).map((msg) =>
          msg.id === assistantMsgId
            ? {
                id: assistantMsgId,
                role: "assistant",
                text: answer,
                citations: citations || [],
                loading: false,
              }
            : msg
        ),
      }));
    } catch (err) {
      setChatMessages((previousMessages) => ({
        ...previousMessages,
        [activePage]: (previousMessages[activePage] || []).map((msg) =>
          msg.id === assistantMsgId
            ? {
                id: assistantMsgId,
                role: "assistant",
                text:
                  err.message ||
                  "The AI classroom assistant is temporarily unavailable. Please verify the AI service is active.",
                citations: [],
                loading: false,
              }
            : msg
        ),
      }));
    } finally {
      setIsChatSubmitting(false);
    }
  }

  // Search notes by title or subject.
  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.subject}`
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  // Filter enrolled classes by title, subject, or professor.
  const filteredClasses = classes.filter((course) =>
    `${course.name} ${course.subject || ""} ${course.professor || ""}`
      .toLowerCase()
      .includes(classSearch.trim().toLowerCase())
  );

  // Build sidebar navigation from the current class list.
  const navGroups = [
    {
      heading: "MY CLASSES",
      items: classes.map((course) => course.name),
    },
    {
      heading: "PERSONAL",
      items: ["My Notes", "Join a class"],
    },
  ];


  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Acad Nexus</span>
        </div>

        <nav className="sidebar-nav" aria-label="Student navigation">
          <button
            className={`nav-link ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => navigateTo("Dashboard")}
          >
            Dashboard
          </button>

          {navGroups.map((group) => (
            <div className="nav-group" key={group.heading}>
              <p className="nav-heading">{group.heading}</p>

              {group.items.map((item) => (
                <button
                  key={item}
                  className={`nav-link ${
                    activePage === item ? "active" : ""
                  }`}
                  onClick={() => navigateTo(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="profile-card">
          <div className="user-actions">
            <strong>{userName}</strong>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <span className="verified-badge">Verified student</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-area">
        {/* Header */}
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR ACADEMIC WORKSPACE</p>

            <h1>
              {activePage === "Dashboard"
                ? `Welcome back, ${userName.split(" ")[0]}`
                : activePage}
            </h1>
          </div>

          <span className="topbar-label">
            Learn from your class PDFs
          </span>
        </header>

        {/* Dashboard */}
        {activePage === "Dashboard" && (
          <div className="dashboard-content">
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR LEARNING SPACE</p>
                  <h2>My classes</h2>
                </div>

                <span className="count-badge">
                  {classes.length} classes
                </span>
              </div>

              {dashboardNotice && (
                <div style={{ marginBottom: "16px" }}>
                  <SuccessMessage message={dashboardNotice} />
                </div>
              )}

              {classesLoading && (
                <LoadingSpinner message="Loading your classes…" />
              )}

              {classesError && (
                <ErrorMessage
                  message={classesError}
                  onRetry={loadClasses}
                />
              )}

              {!classesLoading && !classesError && classes.length === 0 && (
                <EmptyState
                  icon="＋"
                  heading="No classes yet"
                  description="Join a class using a class key from your professor to begin accessing lecture notes and study assistance."
                  action={
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        const inputEl = document.getElementById("join-class-input");
                        if (inputEl) {
                          inputEl.focus();
                          inputEl.scrollIntoView({ behavior: "smooth" });
                        } else {
                          navigateTo("Join a class");
                        }
                      }}
                    >
                      Join a class with key <span>→</span>
                    </button>
                  }
                />
              )}

              {!classesLoading && !classesError && classes.length > 0 && (
                <>
                  <div className="class-search-bar">
                    <input
                      type="search"
                      className="class-search-input"
                      placeholder="Search your classes by name, subject, or professor…"
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      aria-label="Search enrolled classes"
                    />
                  </div>

                  {filteredClasses.length === 0 ? (
                    <EmptyState
                      icon="⌕"
                      heading="No matching classes"
                      description={`No classes match "${classSearch}". Check your spelling or clear the search.`}
                    />
                  ) : (
                    <div className="class-grid">
                      {filteredClasses.map((course) => (
                        <article
                          className="class-card"
                          key={course._id || course.id}
                        >
                          <div className="class-card-header">
                            <div className="course-icon">
                              {course.name
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            {course.subject && (
                              <span className="class-subject-badge">
                                {course.subject}
                              </span>
                            )}
                          </div>

                          <h3>{course.name}</h3>

                          <p className="professor">
                            Prof. {course.professor?.replace(/^Prof\.\s*/i, "")}
                          </p>

                          {course.description && (
                            <p className="class-description">
                              {course.description}
                            </p>
                          )}

                          <div className="class-meta">
                            <span className="class-meta-item">
                              👥 {course.students?.length || 0} students
                            </span>
                          </div>

                          <div className="class-card-actions">
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => navigateTo(course.name)}
                            >
                              Open class chat <span>→</span>
                            </button>
                            <button
                              type="button"
                              className="leave-class-button"
                              onClick={() => setClassToLeave(course)}
                              aria-label={`Leave class ${course.name}`}
                              title="Leave this class"
                            >
                              Leave
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {/* Notices & Deadlines Feed across enrolled classes */}
                  <div style={{ marginTop: "36px" }}>
                    <AnnouncementsFeed
                      announcements={feedAnnouncements}
                      loading={feedAnnouncementsLoading}
                      onRefresh={loadFeedAnnouncements}
                      isProfessor={false}
                    />
                  </div>
                </>
              )}
            </section>

            <aside className="right-column">
              <JoinClassSection
                onClassJoined={handleClassJoined}
                enrolledClasses={classes}
                variant="panel"
              />

              {/* Recent notes */}
              <section className="panel notes-panel">
                <h2>Recent notes</h2>

                {notes.map((note) => (
                  <button
                    className="note-link"
                    key={note.id}
                    onClick={() => navigateTo("My Notes")}
                  >
                    <span className="note-dot" />

                    <span>
                      <strong>{note.title}</strong>
                      <small>{note.subject}</small>
                    </span>

                    <span className="note-arrow">→</span>
                  </button>
                ))}

                <button
                  className="text-button"
                  onClick={() => navigateTo("My Notes")}
                >
                  View all notes →
                </button>
              </section>
            </aside>
          </div>
        )}

        {/* Join class page */}
        {activePage === "Join a class" && (
          <div className="join-page-wrapper">
            <JoinClassSection
              onClassJoined={handleClassJoined}
              enrolledClasses={classes}
              variant="page"
            />

            <button
              className="text-button"
              style={{ margin: "20px 40px" }}
              onClick={() => navigateTo("Dashboard")}
            >
              ← Back to dashboard
            </button>
          </div>
        )}

        {/* My Notes page */}
        {activePage === "My Notes" && (
          <section className="notes-page">
            <div className="notes-page-heading">
              <div>
                <p className="eyebrow">YOUR PERSONAL LIBRARY</p>
                <h2>My Notes</h2>

                <p className="notes-description">
                  Find and revisit notes you've saved from your classes.
                </p>
              </div>

              <span className="count-badge">
                {filteredNotes.length} notes
              </span>
            </div>

            <div className="notes-search">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search by note title or subject..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                aria-label="Search notes"
              />
            </div>

            <div className="notes-list">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <article
                    className="saved-note-card"
                    key={note.id}
                  >
                    <div className="saved-note-icon">▤</div>

                    <div className="saved-note-content">
                      <h3>{note.title}</h3>
                      <p>{note.subject}</p>

                      <span className="saved-note-label">
                        Saved note
                      </span>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setMessage(
                          `Opening "${note.title}" will be available when note details are implemented.`
                        )
                      }
                    >
                      View note →
                    </button>
                  </article>
                ))
              ) : (
                <EmptyState
                  icon="⌕"
                  heading="No notes found"
                  description="Try another search term to find your saved notes."
                />
              )}
            </div>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button
              className="primary-button"
              onClick={() => {
                setSearchQuery("");
                navigateTo("Dashboard");
              }}
            >
              ← Back to dashboard
            </button>
          </section>
        )}

        {/* Class chat page */}
        {classes.some((course) => course.name === activePage) && (
          <section className="chat-page">
            <div className="chat-layout">
              {/* ChatGPT-style Left Sidebar */}
              <aside className="chat-sessions-sidebar">
                <button
                  type="button"
                  className="new-chat-btn"
                  onClick={handleNewChat}
                >
                  <span style={{ fontSize: "16px", fontWeight: "bold" }}>+</span> New Chat
                </button>

                <div className="chat-sessions-header">
                  <span className="chat-sessions-label">Previous Chats</span>
                  {sessionsLoading && <LoadingSpinner size="small" />}
                </div>

                <div className="chat-sessions-list">
                  {chatSessions.length === 0 ? (
                    <div className="chat-sessions-empty">
                      No previous chats yet.<br />Ask a question to start one!
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`chat-session-item ${
                          activeSessionId === session.id ? "active" : ""
                        }`}
                        onClick={() => handleSelectSession(session.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="chat-session-info">
                          <span className="chat-session-icon">💬</span>
                          <span className="chat-session-title" title={session.title}>
                            {session.title || "Conversation"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="chat-session-delete"
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          title="Delete this conversation"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </aside>

              {/* Main Chat Panel */}
              <div className="chat-main-panel">
                <div className="chat-heading">
                  <div>
                    <p className="eyebrow">YOUR CLASSROOM WORKSPACE</p>
                    <h2>{activePage}</h2>
                    <p>
                      {classTab === "announcements"
                        ? "Official announcements and homework/exam deadlines."
                        : activeSessionId && chatSessions.find((s) => s.id === activeSessionId)
                        ? chatSessions.find((s) => s.id === activeSessionId).title
                        : "Ask questions about your class study materials."}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      className="text-button"
                      onClick={() => navigateTo("Dashboard")}
                    >
                      ← Dashboard
                    </button>
                  </div>
                </div>

                {/* Sub-navigation tabs: AI Chat vs Notices */}
                <div className="classroom-tab-nav">
                  <button
                    type="button"
                    className={`classroom-tab-btn ${classTab === "chat" ? "active" : ""}`}
                    onClick={() => setClassTab("chat")}
                  >
                    <span>💬</span> AI Study Assistant
                  </button>
                  <button
                    type="button"
                    className={`classroom-tab-btn ${classTab === "announcements" ? "active" : ""}`}
                    onClick={() => setClassTab("announcements")}
                  >
                    <span>📢</span> Notices & Deadlines
                    {classAnnouncements.length > 0 && (
                      <span className="classroom-tab-badge">
                        {classAnnouncements.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Pinned Announcement Alert Banner */}
                {classTab === "chat" && classAnnouncements.find((a) => a.isPinned) && (
                  <div className="classroom-pinned-banner">
                    <div className="classroom-pinned-content">
                      <span className="classroom-pinned-icon">📌</span>
                      <div className="classroom-pinned-text">
                        <h4>{classAnnouncements.find((a) => a.isPinned).title}</h4>
                        <p>
                          {classAnnouncements.find((a) => a.isPinned).content.slice(0, 130)}
                          {classAnnouncements.find((a) => a.isPinned).content.length > 130 ? "…" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="classroom-pinned-view-btn"
                      onClick={() => setClassTab("announcements")}
                    >
                      View All ({classAnnouncements.length}) →
                    </button>
                  </div>
                )}

                {classTab === "announcements" ? (
                  <div style={{ padding: "16px 0", flex: 1, overflowY: "auto" }}>
                    <AnnouncementsFeed
                      announcements={classAnnouncements}
                      loading={classAnnouncementsLoading}
                      onRefresh={() => {
                        const currentClass = classes.find((c) => c.name === activePage);
                        const classId = currentClass?._id || currentClass?.id;
                        if (classId) loadClassAnnouncements(classId);
                      }}
                      isProfessor={false}
                      currentClass={classes.find((c) => c.name === activePage)}
                    />
                  </div>
                ) : (
                  <>
                    {(chatMessages[activePage] || []).length === 0 && (
                      <div className="chat-suggestions">
                        <p>Try asking</p>

                        {[
                          "Explain the important concepts",
                          "Summarize my class notes",
                          "Give me exam preparation questions",
                        ].map((question) => (
                          <button
                            key={question}
                            className="suggestion-button"
                            onClick={() => setChatInput(question)}
                          >
                            {question} →
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="chat-conversation" aria-live="polite">
                      {chatLoading && (chatMessages[activePage] || []).length === 0 ? (
                        <div className="chat-empty-state">
                          <LoadingSpinner />
                          <p style={{ marginTop: "12px", color: "var(--muted-foreground, #6b7280)" }}>
                            Loading conversation...
                          </p>
                        </div>
                      ) : (chatMessages[activePage] || []).length === 0 ? (
                        <div className="chat-empty-state">
                          <div className="placeholder-icon">✦</div>
                          <h3>What would you like to learn?</h3>
                          <p>
                            Ask a question to start this conversation with your class assistant.
                          </p>
                        </div>
                      ) : (
                        (chatMessages[activePage] || []).map((chatMessage) => (
                          <div
                            key={chatMessage.id}
                            className={`chat-message ${
                              chatMessage.role === "user"
                                ? "user-message"
                                : "assistant-message"
                            }`}
                          >
                            <span className="chat-role">
                              {chatMessage.role === "user" ? "You" : "Acad Nexus AI"}
                            </span>
                            {chatMessage.role === "user" ? (
                              <p style={{ whiteSpace: "pre-wrap" }}>{chatMessage.text}</p>
                            ) : (
                              <ChatMessageContent text={chatMessage.text} />
                            )}

                            {chatMessage.citations && chatMessage.citations.length > 0 && (
                              <div className="chat-citations-bar">
                                <span className="chat-citations-label">Sources:</span>
                                <div className="chat-citations-list">
                                  {chatMessage.citations.map((cite, i) => (
                                    <span
                                      key={i}
                                      className="citation-pill"
                                      title={`Retrieved from ${cite.document_title}`}
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

                    <form className="chat-input-form" onSubmit={sendChatMessage}>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={
                          isChatSubmitting
                            ? "Classroom assistant is thinking..."
                            : `Ask a question about ${activePage}...`
                        }
                        aria-label="Ask your class assistant"
                        disabled={isChatSubmitting}
                      />

                      <button
                        type="submit"
                        className="primary-button"
                        disabled={!chatInput.trim() || isChatSubmitting}
                      >
                        {isChatSubmitting ? "Thinking…" : "Send →"}
                      </button>
                    </form>

                    <p className="chat-disclaimer">
                      Grounded AI: Answers are derived from your course's uploaded study materials with verified source citations.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Other future pages */}
        {activePage !== "Dashboard" &&
          activePage !== "My Notes" &&
          activePage !== "Join a class" &&
          !classes.some((course) => course.name === activePage) && (
            <section className="panel placeholder-panel">
              <div className="placeholder-icon">✦</div>
              <p className="eyebrow">ACAD NEXUS</p>
              <h2>{activePage}</h2>
              <p>
                This section is ready for the next development step.
                We'll build its features and connect them to the backend.
              </p>
              <button
                className="primary-button"
                onClick={() => navigateTo("Dashboard")}
              >
                ← Back to dashboard
              </button>
            </section>
          )}
      </main>

      <ConfirmDialog
        open={Boolean(classToLeave)}
        title="Leave Class"
        message={`Are you sure you want to leave "${classToLeave?.name}"? You will lose access to class materials and conversations until you rejoin with the class key.`}
        confirmLabel={leavingClass ? "Leaving…" : "Leave class"}
        onConfirm={handleConfirmLeaveClass}
        onCancel={() => setClassToLeave(null)}
      />
    </div>
  );
}
